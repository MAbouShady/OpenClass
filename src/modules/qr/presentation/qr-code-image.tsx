import Image from "next/image";

type QrCodeImageProps = {
  readonly dataUrl: string;
  readonly label: string;
};

export function QrCodeImage({ dataUrl, label }: QrCodeImageProps) {
  return <Image src={dataUrl} alt={`QR code for ${label}`} width={200} height={200} unoptimized />;
}
