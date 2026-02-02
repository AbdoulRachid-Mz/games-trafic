// app/fonts.ts
import localFont from "next/font/local";

export const roboto = localFont({
  src: [
    { path: "../public/fonts/roboto/Roboto-Italic-VariableFont_wdth,wght.ttf", weight: "400", style: "italic" },
    { path: "../public/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-roboto",
  display: "swap",
});

export const poppins = localFont({
  src: [
    { path: "../public/fonts/poppins/Poppins-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-ExtraLightItalic.ttf", weight: "200", style: "italic" },
    { path: "../public/fonts/poppins/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-Italic.ttf", weight: "400", style: "italic" },
    { path: "../public/fonts/poppins/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-Black.ttf", weight: "900", style: "normal" },
    { path: "../public/fonts/poppins/Poppins-BlackItalic.ttf", weight: "900", style: "italic" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const montserrat = localFont({
  src: [
    { path: "../public/fonts/montserrat/Montserrat-Italic-VariableFont_wght.ttf", weight: "400", style: "italic" },
    { path: "../public/fonts/montserrat/Montserrat-VariableFont_wght.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-montserrat",
  display: "swap",
});
