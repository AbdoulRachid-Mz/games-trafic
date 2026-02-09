declare module 'qrcode' {
    interface QRCodeOptions {
        errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
        type?: string;
        rendererOpts?: {
            quality?: number;
        };
        margin?: number;
        scale?: number;
        width?: number;
        color?: {
            dark?: string;
            light?: string;
        };
    }

    function toDataURL(text: string | any[], options?: QRCodeOptions): Promise<string>;
    function toCanvas(canvasElement: HTMLCanvasElement, text: string | any[], options?: QRCodeOptions): Promise<void>;
    function toString(text: string | any[], options?: QRCodeOptions): Promise<string>;
}
