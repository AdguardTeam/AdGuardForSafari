# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

import argparse
import logging
from lxml import etree
from pathlib import Path
from datetime import datetime
import copy
import re
from xml.dom import minidom

DEFAULT_ENCODING = "UTF-8"

ITEM_XPATH = "//rss/channel/item"
CHANNEL_XPATH = "sparkle:channel"
RELEASE_NOTES_XPATH = "sparkle:releaseNotesLink/text()"


def get_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Replace <item> elements based on <sparkle:channel> and sort by <pubDate>.")

    parser.add_argument(
        "--source-path",
        type=Path,
        dest="source_path",
        required=True,
        help="Path to the source XML file"
    )

    parser.add_argument(
        "--target-path",
        type=Path,
        dest="target_path",
        required=True,
        help="Path to the target XML file"
    )

    return parser.parse_args()


def validate_file_exists(file_path: Path, file_name: str):
    """Check if file exists and raise an exception if not."""
    if not file_path.exists():
        logging.error(f"{file_name} not found: {file_path}")
        raise FileNotFoundError(f"{file_name} does not exist at {file_path}")


def load_xml(file_path: Path):
    """Load XML from file and return the tree."""
    try:
        return etree.parse(str(file_path))
    except etree.XMLSyntaxError as e:
        logging.error(f"Error parsing XML file {file_path}: {e}")
        raise


def parse_pubdate(item, namespaces):
    """Extract pubDate from an item and return it as a datetime object for sorting."""
    pubdate_str = item.xpath("pubDate/text()")
    if pubdate_str:
        return datetime.strptime(pubdate_str[0], "%a, %d %b %Y %H:%M:%S %z")
    return datetime.min  # return a very early date if no pubDate is found


def preserve_cdata(item, namespaces):
    """Retrieve CDATA content from sparkle:releaseNotesLink."""
    cdata_content = item.xpath(RELEASE_NOTES_XPATH, namespaces=namespaces)
    return cdata_content[0].strip() if cdata_content else ""


def remove_empty_lines(xml_str):
    """Remove empty lines from XML string."""
    return "\n".join([line for line in xml_str.splitlines() if line.strip()])


def replace_or_add_item(source_item, target_tree, namespaces):
    """Replace an item in the target tree if it exists, otherwise add it."""
    channel_value = source_item.xpath(f"{CHANNEL_XPATH}/text()", namespaces=namespaces)
    channel_value = channel_value[0].strip() if channel_value else None

    if channel_value:
        logging.info(f"Processing <item> with <sparkle:channel>: {channel_value}")
        target_items = target_tree.xpath(f"//rss/channel/item[sparkle:channel='{channel_value}']", namespaces=namespaces)
    else:
        logging.info("Processing <item> without <sparkle:channel>")
        target_items = target_tree.xpath("//rss/channel/item[not(sparkle:channel)]", namespaces=namespaces)

    channel_element = target_tree.xpath("//rss/channel", namespaces=namespaces)[0]

    if target_items:
        for target_item in target_items:
            logging.info(f"Replacing item{' with channel: ' + channel_value if channel_value else ''}")
            new_item = copy.deepcopy(source_item)
            target_item.getparent().replace(target_item, new_item)
    else:
        logging.info(f"No matching item found. Adding new item{' with channel: ' + channel_value if channel_value else ''}")
        new_item = copy.deepcopy(source_item)
        channel_element.append(new_item)


def process_items(source_items, target_tree, namespaces):
    """Process and replace <item> elements in the target XML based on source items."""
    for source_item in source_items:
        replace_or_add_item(source_item, target_tree, namespaces)


def format_xml(tree):
    """Format the XML string with proper indentation and CDATA handling."""
    xml_str = etree.tostring(tree, encoding=DEFAULT_ENCODING, xml_declaration=True, method="xml").decode()
    pretty_xml = minidom.parseString(xml_str).toprettyxml(indent="    ")

    # Format CDATA sections in a more readable way
    pretty_xml = re.sub(
        r"(<sparkle:releaseNotesLink>)(<!\[CDATA\[)(.*?)(\]\]>)",
        r"\1\n                \2\3\4\n            ",
        pretty_xml
    )

    # Manually insert the standalone attribute into the XML declaration
    # Insert 'standalone="yes"' after the XML declaration (before the root tag)
    pretty_xml = pretty_xml.replace('<?xml version="1.0" ?>', '<?xml version="1.0" standalone="yes" ?>')

    # Remove the extra empty lines and maintain the correct indentation
    return remove_empty_lines(pretty_xml)


def process_xml(source_xml_path: Path, target_xml_path: Path):
    """Process XML files, replace <item> elements with matching <sparkle:channel>, and sort by <pubDate>."""
    logging.info(f"Loading source XML file: {source_xml_path}")
    source_tree = load_xml(source_xml_path)

    logging.info(f"Loading target XML file: {target_xml_path}")
    target_tree = load_xml(target_xml_path)

    # Define namespaces to be used in XPath queries
    namespaces = {'sparkle': 'http://www.andymatuschak.org/xml-namespaces/sparkle'}

    # Get all <item> elements from the source XML using namespaces
    source_items = source_tree.xpath(ITEM_XPATH, namespaces=namespaces)
    if not source_items:
        logging.warning("No source <item> elements found!")

    process_items(source_items, target_tree, namespaces)

    # Sort items in target XML by pubDate, in descending order
    logging.info("Sorting items in the target XML by <pubDate> (latest first)")
    channel_element = target_tree.xpath("//rss/channel", namespaces=namespaces)[0]
    items = channel_element.xpath("item")

    # Sort items by pubDate, latest first
    sorted_items = sorted(items, key=lambda item: parse_pubdate(item, namespaces), reverse=True)

    # Remove existing <item> elements in the target XML
    for item in items:
        channel_element.remove(item)

    # Add sorted items back to the channel, preserving CDATA
    for item in sorted_items:
        cdata_content = preserve_cdata(item, namespaces)
        if cdata_content:
            release_notes_link = item.xpath("sparkle:releaseNotesLink", namespaces=namespaces)
            if release_notes_link:
                release_notes_link[0].text = etree.CDATA(cdata_content)
        channel_element.append(item)

    # Save the modified target XML with preserved CDATA
    logging.info(f"Saving modified target XML to {target_xml_path}")
    formatted_xml = format_xml(target_tree)

    # Save the formatted XML to the target path
    with open(target_xml_path, "w", encoding=DEFAULT_ENCODING) as f:
        f.write(formatted_xml)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    args = get_args()

    validate_file_exists(args.source_path, "Source XML")
    validate_file_exists(args.target_path, "Target XML")

    process_xml(args.source_path, args.target_path)
