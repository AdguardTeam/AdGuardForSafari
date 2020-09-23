# TODO: Change repo to AdguardTeam

curl -L "https://github.com/Mizzick/SafariConverterLib/releases/latest/download/ConverterTool" > ./libs/ConverterTool
chmod +x ./libs/ConverterTool

LIB_VERSION=$(curl -L "https://api.github.com/repos/Mizzick/SafariConverterLib/releases/latest" |
    grep '"tag_name":' |
    sed -E 's/.*"([^"]+)".*/\1/')

echo "{\"version\": \"$LIB_VERSION\"}" > ./libs/ConverterTool.json
chmod 777 ./libs/ConverterTool.json

