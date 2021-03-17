/**
 * Toggles wrapped elements with checkbox UI
 *
 * @param {Array.<Object>} elements
 */
const toggleCheckbox = (elements) => {
    Array.prototype.forEach.call(elements, (checkbox) => {
        if (checkbox.getAttribute('toggleCheckbox')) {
            // already applied
            return;
        }

        const el = document.createElement('div');
        el.classList.add('toggler');
        el.setAttribute('role', 'checkbox');
        checkbox.parentNode.insertBefore(el, checkbox.nextSibling);

        const checkboxContainer = el.closest('.opt-state');
        checkboxContainer.addEventListener('click', () => {
            checkbox.checked = !checkbox.checked;

            const event = document.createEvent('HTMLEvents');
            event.initEvent('change', true, false);
            checkbox.dispatchEvent(event);
        });

        checkbox.addEventListener('change', () => {
            onClicked(checkbox.checked);
        });

        function onClicked(checked) {
            if (checked) {
                el.classList.add('active');
                el.closest('li').classList.add('active');
            } else {
                el.classList.remove('active');
                el.closest('li').classList.remove('active');
            }
        }

        checkbox.style.display = 'none';
        onClicked(checkbox.checked);

        checkbox.setAttribute('toggleCheckbox', 'true');
    });
};

/**
 * Updates checkbox elements according to checked parameter
 *
 * @param {Array.<Object>} elements
 * @param {boolean} checked
 */
const updateCheckbox = (elements, checked) => {
    Array.prototype.forEach.call(elements, (el) => {
        if (checked) {
            el.setAttribute('checked', 'checked');
            el.closest('li').classList.add('active');
        } else {
            el.removeAttribute('checked');
            el.closest('li').classList.remove('active');
        }
    });
};

module.exports = {
    toggleCheckbox,
    updateCheckbox,
};
