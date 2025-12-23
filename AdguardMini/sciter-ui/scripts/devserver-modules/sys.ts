// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

export const pathsMap: Map<string, string> = new Map([
  // Applications path on user PC
  ['applications', 'applications'],
  // Documents path on user PC
  ['documents', 'documents']
]);


export class File {
  async read() {
      return '';
  }
}

export class fs {
  static open(storagePath: string, mode: string, mask: number) {
      // @TODO: Make websocket server-based on webpack-dev-server
      return new File();
  }
}
