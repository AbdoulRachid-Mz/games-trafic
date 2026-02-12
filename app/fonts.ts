// app/fonts.ts
import localFont from "next/font/local";

export const roboto = localFont({
  src: [
    { path: "/fonts/roboto/Roboto-Italic-VariableFont_wdth,wght.ttf", weight: "400", style: "italic" },
    { path: "/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-roboto",
  display: "swap",
});

export const poppins = localFont({
  src: [
    { path: "/fonts/poppins/Poppins-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "/fonts/poppins/Poppins-ExtraLightItalic.ttf", weight: "200", style: "italic" },
    { path: "/fonts/poppins/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "/fonts/poppins/Poppins-Italic.ttf", weight: "400", style: "italic" },
    { path: "/fonts/poppins/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "/fonts/poppins/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "/fonts/poppins/Poppins-Bold.ttf", weight: "700", style: "normal" },
    { path: "/fonts/poppins/Poppins-Black.ttf", weight: "900", style: "normal" },
    { path: "/fonts/poppins/Poppins-BlackItalic.ttf", weight: "900", style: "italic" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const montserrat = localFont({
  src: [
    { path: "/fonts/montserrat/Montserrat-Italic-VariableFont_wght.ttf", weight: "400", style: "italic" },
    { path: "/fonts/montserrat/Montserrat-VariableFont_wght.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-montserrat",
  display: "swap",
});
