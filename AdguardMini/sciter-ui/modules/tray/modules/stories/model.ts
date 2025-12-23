// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Story ID type
 */
export type StoryId = string;

/**
 * Story card icon classname
 */
export type StoryCardIcon = 'info' | 'quality' | 'phone' | 'custom_filter' | 'star' | 'advanced' | 'adguard';

/**
 * Story background color classname
 */
export type StoryBackgroundColor = 'aqua' | 'blue' | 'green' | 'purple' | 'sand' | 'sandBlue' | 'emerald';

/**
 * Story frame image classname
 */
export type StoryFrameImage = 'advanced' | 'devices' | 'extensions' | 'extra1' | 'extra2' | 'extra3' | 'filters1' | 'filters2' | 'filters3' | 'filters4' | 'filters5' | 'loginItem' | 'rate1' | 'rate2' | 'rate3' | 'ag_mini_mac_release_blogpost';

/**
 * Main story model
 */
export type StoryInfo = {
    /**
     * Warning style for card
     */
    warning?: boolean;
    /**
     * Icon for card
     */
    icon: StoryCardIcon;
    /**
     * Text for card
     */
    text: string;
    /**
     * Story display config
     */
    storyConfig: StoryViewConfig;
};

/**
 * Story view model
 */
export type StoryViewConfig = {
    /**
     * Story identifier
     */
    id: StoryId;

    /**
     * One media frame of a story
     */
    frames: IStoryFrame[];

    /**
     * Story background color class name.
     * In CSS it is used as a class with specified gradient.
     */
    backgroundColor: StoryBackgroundColor;
};

/**
 * Story frame model
 */
export interface IStoryFrame {
    /**
     * Story title
     */
    title: string;
    /**
     * Story description
     */
    description: string;
    /**
     * Story image bound to the CSS class
     */
    image: StoryFrameImage;

    /**
     * Basic action button for frame
     */
    actionButton?: {
        title: string;
        action(): void;
    };

    /**
     * Unique frame id
     */
    frameId: string;

    /**
     * Component to render under frame title and description
     *
     * @see FrameContent
     */
    component?: React.FC<{ isMASReleaseVariant: boolean }>;
}
