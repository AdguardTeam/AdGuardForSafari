// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { observer } from 'mobx-react-lite';
import { useState } from 'preact/hooks';

import { getTdsLink, TDS_PARAMS } from 'Modules/common/utils/links';
import { useOnboardingStore } from 'OnboardingLib/hooks';
import { OnboardingSteps } from 'OnboardingStore/modules';
import theme from 'Theme';
import { Text, Checkbox, Button, ExternalLink, AppUsageDataModal } from 'UILib';

import startImage from './images/start.svg';
import s from './Start.module.pcss';
import { BoolValue } from 'Apis/types';

/**
 * Step "Start"
 */
function StartComponent() {
    const { steps } = useOnboardingStore();

    const [checked, setChecked] = useState(false);
    const [telemetry, setTelemetry] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const { safariExtensions } = steps;

    const action = () => {
        steps.setCurrentStep(safariExtensions.allExtensionsEnabled ? OnboardingSteps.ads : OnboardingSteps.extensions);
        if (telemetry) {
            window.API.settingsService.UpdateAllowTelemetry(new BoolValue({ value: true }));
        }
    };

    const primaryButton = { action, label: translate('onboarding.start.btn'), disabled: !checked };
    return (
        <div className={s.Start_container}>
            <div className={s.Start_content}>
                <div className={s.Start_content_text}>
                    <Text className={s.Start_content_title} type="h4">{translate('onboarding.start.title')}</Text>
                    <Text className={s.Start_content_desc} type="t1">{translate('onboarding.start.desc')}</Text>
                    <div className={s.Start_content_checkbox}>
                        <Checkbox
                            checked={checked}
                            onChange={() => setChecked(!checked)}
                        />
                        <Text className={s.Start_content_checkbox_text} type="t2" onClick={() => setChecked(!checked)}>
                            {translate('onboarding.accept', {
                                eula: (text: string) => (
                                    <ExternalLink href={getTdsLink(TDS_PARAMS.eula)} textType="t2">{text}</ExternalLink>
                                ),
                                privacy: (text: string) => (
                                    <ExternalLink href={getTdsLink(TDS_PARAMS.privacy)} textType="t2">{text}</ExternalLink>
                                ),
                            })}
                        </Text>
                    </div>
                    <div className={s.Start_content_checkbox}>
                        <Checkbox
                            checked={telemetry}
                            onChange={() => setTelemetry(!telemetry)}
                        />
                        <Text className={s.Start_content_checkbox_text} type="t2" onClick={() => setTelemetry(!telemetry)}>
                            {translate('telemetry.accept.send.data', {
                                link: (text: string) => (
                                    <div
                                        className={s.Start_content_checkbox_link}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowModal(true);
                                        }}
                                    >
                                        {text}
                                    </div>
                                ),
                            })}
                        </Text>
                    </div>
                </div>
                <div>
                    <img className={s.Start_image} src={startImage} />
                </div>
            </div>
            <div className={s.Start_buttons}>
                <Button className={theme.button.greenSubmit} disabled={primaryButton.disabled} type="submit" onClick={primaryButton.action}>
                    <Text lineHeight="none" type="t1">{primaryButton.label}</Text>
                </Button>
            </div>
            {showModal && <AppUsageDataModal onClose={() => setShowModal(false)} />}
        </div>
    );
}

export const Start = observer(StartComponent);
