#import <Foundation/Foundation.h>
#import <SafariServices/SafariServices.h>
#include <nan.h>

#define EXT_BUNDLE_ID		@"com.adguard.safari.AdGuard.Extension"

using namespace std;
using namespace Nan;
using namespace v8;


struct SendMessageCallbackInfo {
  Nan::Callback *callback;
  bool result;
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

  auto *info = static_cast<SendMessageCallbackInfo *>(handle->data);

  NSLog(@"Invoking callback with result: %d", info->result);

  v8::Local<v8::Value> argv[1] = {
    Nan::New(info->result)
  };

  Nan::Call(*(info->callback), 1, argv);

  delete info;
  info = nullptr;
  handle->data = nullptr;

  uv_close((uv_handle_t *)handle, DeleteAsyncHandle);
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

		auto *info = new SendMessageCallbackInfo();
		info->result = (error == nil);
		info->callback = cb;

		auto *async = new uv_async_t();
		async->data = info;
		uv_async_init(uv_default_loop(), async, (uv_async_cb)AsyncSendHandler);
		uv_async_send(async);
	}];

}

NAN_MODULE_INIT(Init) {
	Nan::Set(target, New<String>("send").ToLocalChecked(),
	GetFunction(New<FunctionTemplate>(msgToSafariExt)).ToLocalChecked());
}

// macro to load the module when require'd
 NODE_MODULE(safari_ext, Init)
