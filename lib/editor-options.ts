export const FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Raleway",
  "Poppins",
  "Merriweather",
  "Playfair Display",
  "Ubuntu",
  "Nunito",
  "Rubik",
  "Lora",
  "PT Sans",
  "PT Serif",
  "Quicksand",
  "Work Sans",
  "Fira Sans",
  "Inconsolata",
  "Oswald",
  "Times New Roman",
];

export const FONT_SIZE_MIN = 8;
export const FONT_SIZE_MAX = 72;

export const FONT_SIZE_OPTIONS = Array.from(
  { length: FONT_SIZE_MAX - FONT_SIZE_MIN + 1 },
  (_, index) => FONT_SIZE_MIN + index
);
