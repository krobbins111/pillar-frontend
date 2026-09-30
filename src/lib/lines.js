// WMATA's official line colors and names.
export const LINES = {
  RD: { code: "RD", name: "Red Line", color: "#BF0D3E" },
  OR: { code: "OR", name: "Orange Line", color: "#ED8B00" },
  BL: { code: "BL", name: "Blue Line", color: "#009CDE" },
  GR: { code: "GR", name: "Green Line", color: "#00B140" },
  YL: { code: "YL", name: "Yellow Line", color: "#FFD100" },
  SV: { code: "SV", name: "Silver Line", color: "#919D9D" },
};
export const lineFor = (code) => LINES[code] || { code, name: code, color: "#6B6B6B" };
