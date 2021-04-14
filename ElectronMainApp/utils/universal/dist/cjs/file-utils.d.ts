export declare enum AppFileType {
    MACHO = 0,
    PLAIN = 1,
    SNAPSHOT = 2,
    APP_CODE = 3
}
export declare type AppFile = {
    relativePath: string;
    type: AppFileType;
};
/**
 *
 * @param appPath Path to the application
 */
export declare const getAllAppFiles: (appPath: string) => Promise<AppFile[]>;
