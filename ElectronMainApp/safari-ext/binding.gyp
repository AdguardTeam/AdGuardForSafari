{
 "targets": [
   {
     "target_name": "safari-ext",
     "sources": [ "src.mm"],
     "include_dirs" : [
       "<!(node -e \"require('nan')\")",
     ],
     "libraries": [
        "../shared/libshared.a"
      ],
     "xcode_settings": {
       "OTHER_CPLUSPLUSFLAGS": ["-std=c++11", "-stdlib=libc++", "-mmacosx-version-min=10.12"],
       "OTHER_LDFLAGS": ["-framework CoreFoundation -framework SafariServices"]
     }
   }
 ]
}
