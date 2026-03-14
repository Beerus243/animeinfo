import Image from "next/image";

import brandLogo from "@/assets/logo/logo.png";

type BrandLogoProps = {
  size?: "header" | "mobile" | "footer";
};

export default function BrandLogo({ size = "header" }: BrandLogoProps) {
  const sizeClassName =
    size === "footer"
      ? "brand-logo brand-logo-footer"
      : size === "mobile"
        ? "brand-logo brand-logo-mobile"
        : "brand-logo brand-logo-header";

  return (
    <span className={sizeClassName} aria-hidden="true">
      <Image alt="" className="brand-logo-image h-full w-full object-contain" priority={size === "header"} src={brandLogo} />
    </span>
  );
}