# react-native-fchat-webchat
webchat library for fchat 

Hướng dẫn tích hợp webchat Fchat cho app react-native

1, Cài đặt thư viện fchat - webchat

	yarn add https://github.com/nguyenduybinh248/react-native-fchat-webchat.git

2, Cài đặt các thư viện dependency

Cài đặt thư viện react-native

yarn add react-native-actions-sheet react-native-gesture-handler react-native-gifted-chat react-native-image-crop-picker react-native-modal react-native-permissions react-native-safe-area-context react-native-screens @react-native-async-storage/async-storage @react-native-community/masked-view 

Link native code
- Với hệ điều hành android: Đã tự động link
- Với hệ điều hành ios:    cd ios && pod install


3, Setup các thư viện theo hướng dẫn
https://github.com/zoontek/react-native-permissions



4, Build lại app 

5, Tích hợp Fchat - webchat 


	import FchatWebchat from 'react-native-fchat-webchat'

	<FchatWebchat pageId='page-token của bạn'/>

