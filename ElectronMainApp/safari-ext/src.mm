#import <Foundation/Foundation.h>
#import <SafariServices/SafariServices.h>
#import "shared/AESharedResources.h"
#include <nan.h>


#define EXT_BUNDLE_ID		@"com.adguard.safari.AdGuard.Extension"

using namespace std;
using namespace Nan;
using namespace v8;

typedef enum {
  CallbackTypeForSend = 1,
  CallbackTypeForBlockingContentRules
} CallbackType;

struct CallbackInfo {
  Nan::Callback *callback;
  CallbackType type;
  void *result;
};

static void DeleteAsyncHandle(uv_handle_t *handle) {
  delete (uv_async_t *)handle;
}

/**
 * This handler runs in the V8 context as a result of `uv_async_send`. Here we
 * retrieve our event information and invoke the saved callback.
 */
static void AsyncSendHandler(uv_async_t *handle) {
  Nan::HandleScope scope;

  auto *info = static_cast<CallbackInfo *>(handle->data);

  NSLog(@"Invoking callback with type: %d", info->type);

#define c_arg(N) argc = N; argv = (v8::Local<v8::Value> *)malloc(sizeof(v8::Local<v8::Value>)*N) 

  int argc = 0;
  v8::Local<v8::Value> *argv = NULL;
  NSString *string;
  switch(info->type) {
    case CallbackTypeForSend:
      c_arg(1);
      argv[0] = Nan::New(*(bool *)(info->result));
      free(info->result);
      break;

    case CallbackTypeForBlockingContentRules:
       c_arg(1);
       string = CFBridgingRelease(info->result);
       argv[0] = Nan::New(string.UTF8String).ToLocalChecked();
      break;

    default:
      break;
  }

  Nan::Call(*(info->callback), argc, argv);

  string = nil;
  delete info;
  info = nullptr;
  handle->data = nullptr;

  uv_close((uv_handle_t *)handle, DeleteAsyncHandle);
}

NAN_METHOD(getPath) {

  NSString *groupPath = AESharedResources.sharedResuorcesURL.path;
  if (groupPath.length) {
    info.GetReturnValue().Set(Nan::New(groupPath.UTF8String).ToLocalChecked());
  }
}

NAN_METHOD(msgToSafariExt) {

    if (info.Length() < 3) {
        ThrowTypeError("Wrong number of arguments");
        return;
    }

    if (!info[0]->IsString() || !info[1]->IsString() || !info[2]->IsFunction()) {
        ThrowTypeError("Wrong arguments");
        return;
    }

    Nan::Utf8String msg (info[0]);
    if (msg.length() == 0)
     {
        ThrowTypeError("Wrong arguments");
        return;
     }
    NSString *message = [NSString stringWithUTF8String: *msg];

    Nan::Utf8String prms (info[1]);
    NSString *paramsJson = [NSString new];
    if (prms.length() > 0)
     {
        paramsJson = [NSString stringWithUTF8String: *prms];
     }

    Nan::Callback *cb = new Nan::Callback(info[2].As<Function>());

    NSDictionary *infoDict = @{@"params": paramsJson};


    NSLog(@"Sending message (%@) to Safari App Extension with info (%@)", message, infoDict);
    [SFSafariApplication dispatchMessageWithName:message
                       toExtensionWithIdentifier:EXT_BUNDLE_ID
                                        userInfo:infoDict
                               completionHandler:^(NSError * _Nullable error) {

                                   NSLog(@"Error object: %@", error);

                                   auto *info = new CallbackInfo();
                                   info->type = CallbackTypeForSend;
                                   info->result = malloc(sizeof(bool));
                                   *(bool *)info->result = (error == nil);
                                   info->callback = cb;

                                   auto *async = new uv_async_t();
                                   async->data = info;
                                   uv_async_init(uv_default_loop(), async, (uv_async_cb)AsyncSendHandler);
                                   uv_async_send(async);
                               }];

}

NAN_METHOD(blockingContentRulesJson) {

    if (info.Length() < 1) {
        ThrowTypeError("Wrong number of arguments");
        return;
    }

    if (!info[0]->IsFunction()) {
        ThrowTypeError("Wrong arguments");
        return;
    }

    Nan::Callback *cb = new Nan::Callback(info[0].As<Function>());


      dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
        NSLog(@"GEtting blocking rules in global queue");
        NSData *data = AESharedResources.blockingContentRules;

        NSString *blockingContentRules = data.length ?[[NSString alloc]
                                                      initWithData:data
                                                      encoding:NSUTF8StringEncoding]
        : @"";

        auto *info = new CallbackInfo();
        info->type = CallbackTypeForBlockingContentRules;
        info->result = (void *)CFBridgingRetain(blockingContentRules);
        info->callback = cb;

        auto *async = new uv_async_t();
        async->data = info;
        uv_async_init(uv_default_loop(), async, (uv_async_cb)AsyncSendHandler);
        uv_async_send(async);

    });
}

NAN_MODULE_INIT(Init) {
  /*
  Sends message to extension.
  Usage:
  obj.send("message-name","params-like-string-may-be-json", (bool_result)=>{ console.log(bool_result);});
  */
	Nan::Set(target, New<String>("send").ToLocalChecked(),
	GetFunction(New<FunctionTemplate>(msgToSafariExt)).ToLocalChecked());
  /*
  Gets path to folder, which shares between app and extension.
  Usage:
  var path = obj.path();
  */
  Nan::Set(target, New<String>("path").ToLocalChecked(),
  GetFunction(New<FunctionTemplate>(getPath)).ToLocalChecked());
  /*
  TEST METHOD
  Gets json from group folder.
  Usage:
  obj.blockingContentRules((string_content)=>{console.log(string_content);});
  */
  Nan::Set(target, New<String>("blockingContentRules").ToLocalChecked(),
  GetFunction(New<FunctionTemplate>(blockingContentRulesJson)).ToLocalChecked());
}

// macro to load the module when require'd
 NODE_MODULE(safari_ext, Init)
