const { ipcRenderer } = require('electron');

function addCustomFilter(e) {
    e.preventDefault();

    renderCustomFilterPopup();
}

function removeCustomFilter(e) {
    e.preventDefault();
    e.stopPropagation();

    const filterId = e.currentTarget.getAttribute('filterId');
    ipcRenderer.send('renderer-to-main', JSON.stringify({
        'type': 'removeAntiBannerFilter',
        filterId,
    }));

    const filterElement = document.querySelector(`#filter${filterId}`);
    filterElement.parentNode.removeChild(filterElement);
}

let customPopupInitialized = false;
function renderCustomFilterPopup() {
    const POPUP_ACTIVE_CLASS = 'option-popup__step--active';

    function closePopup() {
        document.querySelector('#add-custom-filter-popup').classList.remove('option-popup--active');
    }

    function clearActiveStep() {
        const steps = document.querySelectorAll('[id^="add-custom-filter-step-"]');
        steps.forEach((el) => el.classList.remove(POPUP_ACTIVE_CLASS));

        document.querySelector('#custom-filter-popup-close').style.display = 'block';
    }

    function fillLoadedFilterDetails(filter) {
        const titleInputEl = document.querySelector('#custom-filter-popup-added-title');
        if (filter.name) {
            titleInputEl.value = filter.name;
        } else {
            titleInputEl.value = filter.customUrl;
        }

        document.querySelector('#custom-filter-popup-added-desc').textContent = filter.description;
        document.querySelector('#custom-filter-popup-added-version').textContent = filter.version;
        document.querySelector('#custom-filter-popup-added-rules-count').textContent = filter.rulesCount;
        document.querySelector('#custom-filter-popup-added-homepage').textContent = filter.homepage;
        document.querySelector('#custom-filter-popup-added-homepage').setAttribute('href', filter.homepage);
        document.querySelector('#custom-filter-popup-added-url').textContent = filter.customUrl;
        document.querySelector('#custom-filter-popup-added-url').setAttribute('href', filter.customUrl);
    }

    function removeAntiBannerFilter(filterId) {
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'removeAntiBannerFilter',
            filterId,
        }));
    }

    let onSubscribeClicked;
    let onSubscriptionCancel;
    let onPopupCloseClicked;
    let onSubscribeBackClicked;

    function renderInputFilter() {
        clearActiveStep();
        document.querySelector('#add-custom-filter-step-1').classList.add(POPUP_ACTIVE_CLASS);

        document.querySelector('#custom-filter-popup-url').focus();

        if (onPopupCloseClicked) {
            document.querySelector('#custom-filter-popup-close').removeEventListener('click', onPopupCloseClicked);
        }

        onPopupCloseClicked = () => closePopup();
        document.querySelector('#custom-filter-popup-close').addEventListener('click', onPopupCloseClicked);

        document.querySelector('#custom-filter-popup-cancel').addEventListener('click', onPopupCloseClicked);
    }

    function renderDownloadingFilter() {
        clearActiveStep();
        document.querySelector('#add-custom-filter-step-2').classList.add(POPUP_ACTIVE_CLASS);
        document.querySelector('#custom-filter-popup-close').style.display = 'none';
    }

    function renderError() {
        clearActiveStep();
        document.querySelector('#add-custom-filter-step-3').classList.add(POPUP_ACTIVE_CLASS);
    }

    function renderConfirmFilterData(filter) {
        clearActiveStep();
        document.querySelector('#add-custom-filter-step-4').classList.add(POPUP_ACTIVE_CLASS);
        document.querySelector('#custom-filter-popup-trusted').checked = false;

        fillLoadedFilterDetails(filter);

        if (onSubscribeClicked) {
            document.querySelector('#custom-filter-popup-added-subscribe')
                .removeEventListener('click', onSubscribeClicked);
        }
        onSubscribeClicked = (e) => {
            e.preventDefault();
            const title = document.querySelector('#custom-filter-popup-added-title').value || '';
            const trustedCheckbox = document.querySelector('#custom-filter-popup-trusted');
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'subscribeToCustomFilter',
                url: filter.customUrl,
                title: title.trim(),
                trusted: trustedCheckbox.checked,
            }));
            renderSubscribingFilter();
            ipcRenderer.once('subscribeToCustomFilterSuccessResponse', () => {
                closePopup();
            });
            ipcRenderer.once('subscribeToCustomFilterErrorResponse', () => {
                renderError();
            });
        };
        document.querySelector('#custom-filter-popup-added-subscribe')
            .addEventListener('click', onSubscribeClicked);

        if (onSubscriptionCancel) {
            document.querySelector('#custom-filter-popup-remove')
                .removeEventListener('click', onSubscriptionCancel);
        }
        onSubscriptionCancel = () => {
            removeAntiBannerFilter(filter.filterId);
            closePopup();
        };
        document.querySelector('#custom-filter-popup-remove')
            .addEventListener('click', onSubscriptionCancel);

        if (onSubscribeBackClicked) {
            document.querySelector('#custom-filter-popup-added-back')
                .removeEventListener('click', onSubscribeBackClicked);
        }
        onSubscribeBackClicked = () => {
            removeAntiBannerFilter(filter.filterId);
            renderInputFilter();
        };
        document.querySelector('#custom-filter-popup-added-back')
            .addEventListener('click', onSubscribeBackClicked);

        if (onPopupCloseClicked) {
            document.querySelector('#custom-filter-popup-close')
                .removeEventListener('click', onPopupCloseClicked);
        }
        onPopupCloseClicked = () => {
            removeAntiBannerFilter(filter.filterId);
            closePopup();
        };
        document.querySelector('#custom-filter-popup-close')
            .addEventListener('click', onPopupCloseClicked);
    }

    function renderSubscribingFilter() {
        clearActiveStep();
        document.querySelector('#add-custom-filter-step-5').classList.add(POPUP_ACTIVE_CLASS);
        document.querySelector('#custom-filter-popup-close').style.display = 'none';
    }

    function submitUrl(e) {
        e.preventDefault();

        const url = document.querySelector('#custom-filter-popup-url').value;
        ipcRenderer.send('renderer-to-main', JSON.stringify({
            'type': 'loadCustomFilterInfo',
            url,
        }));

        ipcRenderer.on('loadCustomFilterInfoResponse', (e, arg) => {
            if (arg) {
                renderConfirmFilterData(arg);
            } else {
                renderError();
            }
        });

        renderDownloadingFilter();
    }

    function bindEvents() {
        // Step one events
        document.querySelector('#custom-filter-popup-url')
            .addEventListener('keyup', (e) => {
                e.preventDefault();

                if (e.keyCode === 13) {
                    submitUrl(e);
                }
            });
        document.querySelector('.custom-filter-popup-next').addEventListener('click', submitUrl);

        const importCustomFilterFile = document.querySelector('#importCustomFilterFile');
        const customFilterImportBtn = document.querySelector('.custom-filter-import-file');

        customFilterImportBtn.addEventListener('click', (event) => {
            event.preventDefault();
            importCustomFilterFile.click();
        });

        importCustomFilterFile.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file.type !== 'text/plain') {
                renderError();
                return;
            }
            const filePath = `file://${file.path}`;
            ipcRenderer.send('renderer-to-main', JSON.stringify({
                'type': 'loadCustomFilterInfo',
                url: filePath,
            }));

            ipcRenderer.once('loadCustomFilterInfoResponse', (e, arg) => {
                importCustomFilterFile.value = '';
                /* eslint-disable-next-line no-unused-expressions */
                arg ? renderConfirmFilterData(arg) : renderError();
            });
        });

        // Step three events
        document.querySelector('.custom-filter-popup-try-again')
            .addEventListener('click', renderInputFilter);
    }

    if (!customPopupInitialized) {
        bindEvents();
        customPopupInitialized = true;
    }

    document.querySelector('#add-custom-filter-popup').classList.add('option-popup--active');
    document.querySelector('#custom-filter-popup-url').value = '';
    renderInputFilter();
}

module.exports = {
    addCustomFilter,
    removeCustomFilter,
};
