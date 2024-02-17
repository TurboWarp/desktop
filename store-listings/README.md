# Store listing scripts

## Microsoft Store

1. Go to top submission on https://partner.microsoft.com/en-us/dashboard/products/9P4DPZGV5ZKL/overview
2. Press "Export listings" and save as "from-microsoft.csv"
3. Run scratch-l10n `npm run tw:pull`
4. Run `node generate.js`
5. Press "Import listings" then select "import-to-microsoft.csv"
