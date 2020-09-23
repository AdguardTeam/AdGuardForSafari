curl -L "https://github.com/AdguardTeam/SafariConverterLib/releases/latest/download/ConverterTool" > ./libs/ConverterTool
chmod +x ./libs/ConverterTool

LIB_VERSION=$(curl -L "https://api.github.com/repos/AdguardTeam/SafariConverterLib/releases/latest" |
    grep '"tag_name":' |
    sed -E 's/.*"([^"]+)".*/\1/')

touch ./libs/ConverterTool.json
echo "{\"version\": \"$LIB_VERSION\"}" > ./libs/ConverterTool.json

