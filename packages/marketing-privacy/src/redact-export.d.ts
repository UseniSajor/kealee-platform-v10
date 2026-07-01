export declare function sanitizeMarketingExport<T>(data: T, depth?: number): T;
export declare function assertPublicSafeAsset(asset: {
    public_safe?: boolean;
    contains_customer_data?: boolean;
    approval_status?: string;
}): void;
