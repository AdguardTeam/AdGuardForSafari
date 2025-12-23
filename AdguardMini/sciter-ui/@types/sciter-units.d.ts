// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

type BoxPart = 'left' | 'top' | 'right' | 'bottom' | 'width' | 'height' | 'xywh' | 'rectw' | 'rect' | 'position' | 'dimension';

type BoxOf = 'border' | 'client' | 'cursor' | 'caret';

type RelTo = 'desktop' | 'monitor' | 'self';
