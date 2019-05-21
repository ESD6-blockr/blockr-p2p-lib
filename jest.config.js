module.exports = {
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/__tests__/**/*",
    ],
    coverageReporters: [
        "text",
        "lcov",
        "cobertura",
    ],
    displayName: {
        color: "blue",
        name: "blockr-logger",
    },
    reporters: [
        "default",
        "jest-junit",
    ],
    testMatch: [
        "**/__tests__/**/*.test.+(ts|tsx)",
    ],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
};
