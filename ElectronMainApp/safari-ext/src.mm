#import <Foundation/Foundation.h>
#import <SafariServices/SafariServices.h>
#import "shared/AESharedResources.h"
#import "shared/CommonLib/ACLang.h"
#include <nan.h>


#define EXT_BUNDLE_ID		@"com.adguard.safari.AdGuard.Extension"

using namespace std;
using namespace Nan;
using namespace v8;

typedef enum {
  CallbackTypeForBlockingContentRules = 1,
  CallbackTypeForEmptyResponse,
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

  DDLogCDebug(@"Invoking callback with type: %d", info->type);

#define c_arg(N) argc = N; argv = (v8::Local<v8::Value> *)malloc(sizeof(v8::Local<v8::Value>)*N) 

  int argc = 0;
  v8::Local<v8::Value> *argv = NULL;
  NSString *string;
  switch(info->type) {
    case CallbackTypeForEmptyResponse:
      c_arg(0);
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
/*
NAN_METHOD(getEnabled) {

    info.GetReturnValue().Set(Nan::New((bool)[AESharedResources.sharedDefaults boolForKey:AEDefaultsEnabled]).ToLocalChecked());
}
NAN_METHOD(setEnabled) {

    if (info.Length() < 1) {
        ThrowTypeError("Wrong number of arguments");
        return;
    }

    if (!info[0]->IsBoolean()) {
        ThrowTypeError("Wrong arguments");
        return;
    }

    [AESharedResources.sharedDefaults setBool:(BOOL)info[0].value() forKey:AEDefaultsEnabled];
}
*/
NAN_METHOD(setWhitelistDomains) {

    if (info.Length() < 2) {
        ThrowTypeError("Wrong number of arguments");
        return;
    }

    if (!info[0]->IsArray() || !info[1]->IsFunction()) {
        ThrowTypeError("Wrong arguments");
        return;
    }

    Nan::Callback *cb = new Nan::Callback(info[1].As<Function>());

    Local<Array> array = Local<Array>::Cast(info[0]);
    NSMutableArray *domains = [NSMutableArray new];

    for (unsigned int i = 0; i < array->Length(); i++ ) {
      Local<Value> val = array->Get(i);
      if (! val.IsEmpty()) {
        Nan::Utf8String item(val);
        if (item.length() > 0) {
          NSString *domain = [[NSString alloc] initWithBytesNoCopy:*item 
                                              length:item.length() 
                                              encoding:NSUTF8StringEncoding
                                               freeWhenDone:NO];
          if (domain) {
            [domains addObject:domain];
          }
        }
      }
    }

    DDLogCDebug(@"List of domains count: %lu", domains.count);

    [AESharedResources setWhitelistDomains:domains completion:^{
      DDLogCDebug(@"Domains saved");

      auto *info = new CallbackInfo();
      info->type = CallbackTypeForEmptyResponse;
      info->result = NULL;
      info->callback = cb;

      auto *async = new uv_async_t();
      async->data = info;
      uv_async_init(uv_default_loop(), async, (uv_async_cb)AsyncSendHandler);
      uv_async_send(async);
    }];
}

NAN_METHOD(setUserFilter) {

    if (info.Length() < 2) {
        ThrowTypeError("Wrong number of arguments");
        return;
    }

    if (!info[0]->IsArray() || !info[1]->IsFunction()) {
        ThrowTypeError("Wrong arguments");
        return;
    }

    Nan::Callback *cb = new Nan::Callback(info[1].As<Function>());

    Local<Array> array = Local<Array>::Cast(info[0]);
    NSMutableArray *rules = [NSMutableArray new];

    for (unsigned int i = 0; i < array->Length(); i++ ) {
      Local<Value> val = array->Get(i);
      if (! val.IsEmpty()) {
        Nan::Utf8String item(val);
        if (item.length() > 0) {
          NSString *rule = [[NSString alloc] initWithBytesNoCopy:*item 
                                              length:item.length() 
                                              encoding:NSUTF8StringEncoding
                                               freeWhenDone:NO];
          if (rule) {
            [rules addObject:rule];
          }
        }
      }
    }

    DDLogCDebug(@"List of rules count: %lu", rules.count);

    [AESharedResources setUserFilterRules:rules completion:^{
      DDLogCDebug(@"UserFilter saved");

      auto *info = new CallbackInfo();
      info->type = CallbackTypeForEmptyResponse;
      info->result = NULL;
      info->callback = cb;

      auto *async = new uv_async_t();
      async->data = info;
      uv_async_init(uv_default_loop(), async, (uv_async_cb)AsyncSendHandler);
      uv_async_send(async);
    }];
}

NAN_METHOD(setContentBlockingJson) {

    if (info.Length() < 2) {
        ThrowTypeError("Wrong number of arguments");
        return;
    }

    if (!info[0]->IsString() || !info[1]->IsFunction()) {
        ThrowTypeError("Wrong arguments");
        return;
    }
    NSData *data = [NSData new];
    Nan::Utf8String msg (info[0]);
    if (msg.length() > 0) {
        data = [NSData dataWithBytesNoCopy:*msg length:msg.length()];
     }

    Nan::Callback *cb = new Nan::Callback(info[1].As<Function>());

    [AESharedResources setBlockingContentRulesJson:data completion:^{
      DDLogCDebug(@"Json updated in file. Notify the content blocker extension.");
      [SFContentBlockerManager 
      reloadContentBlockerWithIdentifier:AESharedResources.blockerBundleId
      completionHandler:^(NSError * _Nullable error) {
        DDLogCDebug(@"Notifying completion with error: %@", error ?: @"[no error]");
        NSString *jsonResult = @"{\"result\":\"success\"}";
          if (error) {
              jsonResult = [NSString stringWithFormat:@"{\"result\":\"error\", \"error\":{\"domain\":\"%@\", \"code\":%ld, \"descr\":\"%@\"}", 
              error.domain, error.code, error.localizedDescription];
          }

        auto *info = new CallbackInfo();
        info->type = CallbackTypeForBlockingContentRules;
        info->result = (void *)CFBridgingRetain(jsonResult);
        info->callback = cb;

        auto *async = new uv_async_t();
        async->data = info;
        uv_async_init(uv_default_loop(), async, (uv_async_cb)AsyncSendHandler);
        uv_async_send(async);
      }];
    }];
}

NAN_METHOD(setBusy) {

    if (info.Length() < 1) {
        ThrowTypeError("Wrong number of arguments");
        return;
    }

    if (!info[0]->IsBoolean()) {
        ThrowTypeError("Wrong arguments");
        return;
    }

    BOOL val = info[0]->BooleanValue(); 
    [[AESharedResources sharedDefaults] setBool:val forKey:AEDefaultsMainAppBusy];
    [AESharedResources notifyBusyChanged];
}

NAN_METHOD(setProtection) {

    if (info.Length() < 1) {
        ThrowTypeError("Wrong number of arguments");
        return;
    }

    if (!info[0]->IsBoolean()) {
        ThrowTypeError("Wrong arguments");
        return;
    }

    BOOL val = info[0]->BooleanValue(); 
    [[AESharedResources sharedDefaults] setBool:val forKey:AEDefaultsEnabled];
    [AESharedResources notifyBusyChanged];
}

NAN_METHOD(userFilter) {

    if (info.Length() < 1) {
        ThrowTypeError("Wrong number of arguments");
        return;
    }

    if (!info[0]->IsFunction()) {
        ThrowTypeError("Wrong arguments");
        return;
    }

    Nan::Callback *cb = new Nan::Callback(info[0].As<Function>());

    [AESharedResources userFilterRulesWithCompletion:^(NSArray <NSString *> *rules){

        dispatch_sync(dispatch_get_main_queue(), ^{
            Nan::HandleScope scope;

            Local<Array> result = Nan::New<Array>();

            NSUInteger i = 0;
            for (NSString *item in rules) {
                result->Set(i++, Nan::New(item.UTF8String).ToLocalChecked());
            }
            v8::Local<v8::Value> argv[1] = {result};

            Nan::Call(*cb, 1, argv);
            delete cb;
        });
    }];
} 

NAN_METHOD(whitelistDomains) {

    if (info.Length() < 1) {
        ThrowTypeError("Wrong number of arguments");
        return;
    }

    if (!info[0]->IsFunction()) {
        ThrowTypeError("Wrong arguments");
        return;
    }
    
    Nan::Callback *cb = new Nan::Callback(info[0].As<Function>());

    [AESharedResources whitelistDomainsWithCompletion:^(NSArray <NSString *> *domains){

        dispatch_sync(dispatch_get_main_queue(), ^{
            Nan::HandleScope scope;

            Local<Array> result = Nan::New<Array>();

            NSUInteger i = 0;
            for (NSString *item in domains) {
                result->Set(i++, Nan::New(item.UTF8String).ToLocalChecked());
            }
            v8::Local<v8::Value> argv[1] = {result};

            Nan::Call(*cb, 1, argv);
            delete cb;
        });
    }];
}

NAN_MODULE_INIT(Init) {

    [AESharedResources initLogger];

	Nan::Set(target, New<String>("setBusy").ToLocalChecked(),
	GetFunction(New<FunctionTemplate>(setBusy)).ToLocalChecked());

  Nan::Set(target, New<String>("setProtectionEnabled").ToLocalChecked(),
  GetFunction(New<FunctionTemplate>(setProtection)).ToLocalChecked());

  Nan::Set(target, New<String>("setContentBlockingJson").ToLocalChecked(),
  GetFunction(New<FunctionTemplate>(setContentBlockingJson)).ToLocalChecked());

  Nan::Set(target, New<String>("setWhitelistDomains").ToLocalChecked(),
  GetFunction(New<FunctionTemplate>(setWhitelistDomains)).ToLocalChecked());

  Nan::Set(target, New<String>("setUserFilter").ToLocalChecked(),
  GetFunction(New<FunctionTemplate>(setUserFilter)).ToLocalChecked());

  Nan::Set(target, New<String>("userFilter").ToLocalChecked(),
  GetFunction(New<FunctionTemplate>(userFilter)).ToLocalChecked());

  Nan::Set(target, New<String>("whitelistDomains").ToLocalChecked(),
  GetFunction(New<FunctionTemplate>(whitelistDomains)).ToLocalChecked());
}

// macro to load the module when require'd
 NODE_MODULE(safari_ext_addon, Init)
