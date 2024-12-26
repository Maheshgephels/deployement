const unitsConversion = {
    px: {
        cm: 0.0264583,
        inch: 0.0104167
    },
    cm: {
        px: 1 / 0.0264583,
        inch: 0.393701
    },
    inch: {
        px: 1 / 0.0104167,
        cm: 1 / 0.393701
    }
};

export const convertSizeUnit = (size, newUnit) => {
    const conversionFactor = unitsConversion[size.unit][newUnit];
    const convertedWidth = size.width * conversionFactor;
    const convertedHeight = size.height * conversionFactor;
    return { width: convertedWidth, height: convertedHeight, unit: newUnit };
};
