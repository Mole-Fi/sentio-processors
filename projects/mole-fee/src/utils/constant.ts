export const CLMM_MAINNET = "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb"
export const STABLE_FARM_MAINNET = "0x11ea791d82b5742cc8cab0bf7946035c97d9001d7c3803a93f119753da66f526"
export const INTEGRATE_MAINNET = "0x2eeaab737b37137b94bfa8f841f92e36a153641119da3456dec1926b9960d9be"
export const LAUNCHPAD_MAINNET = "0x80d114c5d474eabc2eb2fcd1a0903f1eb5b5096a8dc4184d72453f7a9be728e4"
export const BLUEFIN_SPOT = "0x3492c874c1e3b3e2984e8c41b589e642d4d0a5d6459e5a9cfc2d52fd7c89c267"

// key: pool_id , 
// value is dex_type :
//                 0 cetusclmm, 
//                 1 bluefin 
export const POOLS_MOLE_LIST = new Map([
    // Before Cetus Incident

    // cetus_clmm_pool_wusdc_sui
    ["0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630", 0],
    // cetus_clmm_pool_usdt_wusdc: 
    ["0xc8d7a1503dc2f9f5b05449a87d8733593e2f0f3e7bffd90541252782e4d2ca20", 0],
    // cetus_clmm_pool_weth_wusdc:
    ["0x5b0b24c27ccf6d0e98f3a8704d2e577de83fa574d3a9060eb8945eeb82b3e2df", 0],
    // cetus_clmm_pool_usdt_sui:
    ["0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3", 0],
    // cetus_clmm_pool_hasui_sui:
    ["0x871d8a227114f375170f149f7e9d45be822dd003eba225e83c05ac80828596bc", 0],
    // cetus_clmm_pool_wusdc_cetus: 
    ["0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8", 0],
    // cetus_clmm_pool_cetus_sui: 
    ["0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded", 0],
    // cetus_clmm_pool_navx_sui:
    ["0x0254747f5ca059a1972cd7f6016485d51392a3fde608107b93bbaebea550f703", 0],
    // cetus_clmm_pool_navx_cetus: 
    ["0x3ec8401520022aac67935188eb1f82c13cbbc949ab04692e5b62445d89b61c9f", 0],
    // cetus_clmm_pool_sca_sui:
    ["0xaa72bd551b25715b8f9d72f226fa02526bdf2e085a86faec7184230c5209bb6e", 0],
    // cetus_clmm_pool_wusdc_wbtc: 
    ["0xaa57c66ba6ee8f2219376659f727f2b13d49ead66435aa99f57bb008a64a8042", 0],
    // cetus_clmm_pool_buck_wusdc: 
    ["0x81fe26939ed676dd766358a60445341a06cea407ca6f3671ef30f162c84126d5", 0],
    // cetus_clmm_pool_usdc_sui
    ["0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105", 0],
    // cetus_clmm_pool_usdc_usdt
    ["0x6bd72983b0b5a77774af8c77567bb593b418ae3cd750a5926814fcd236409aaa", 0],
    // cetus_clmm_pool_usdc_cetus
    ["0x3b13ac70030d587624e407bbe791160b459c48f1049e04269eb8ee731f5442b4", 0],
    // cetus_clmm_pool_usdc_wusdc
    ["0xc29be5c19c35be7af76c89e85e6deb076789d70019b9f8d22a80e77e720bdec0", 0],
    // cetus_clmm_pool_usdc_buck
    ["0x4c50ba9d1e60d229800293a4222851c9c3f797aa5ba8a8d32cc67ec7e79fec60", 0],
    // cetus_clmm_pool_buck_sui
    ["0x59cf0d333464ad29443d92bfd2ddfd1f794c5830141a5ee4a815d1ef3395bf6c", 0],
    // cetus_clmm_pool_usdc_wusdc: new
    ["0x1efc96c99c9d91ac0f54f0ca78d2d9a6ba11377d29354c0a192c86f0495ddec7", 0],
    // cetus_clmm_pool_buck_wusdc: new
    ["0xd4573bdd25c629127d54c5671d72a0754ef47767e6c01758d6dc651f57951e7d", 0],
    // cetus_clmm_pool_usdc_suiusdt
    ["0x7df346f8ef98ad20869ff6d2fc7c43c00403a524987509091b39ce61dde00957", 0],
    // cetus_clmm_pool_fdusd_usdc
    ["0x43d4c9adc1d669ef85d557cf1d430f311dc4eb043a8e7b78e972c1f96ec2cd60", 0],
    // cetus_clmm_pool_usdc_usdy
    ["0xdcd762ad374686fa890fc4f3b9bbfe2a244e713d7bffbfbd1b9221cb290da2ed", 0],
    // cetus_clmm_pool_usdc_suiusdt_2 
    ["0xb8a67c149fd1bc7f9aca1541c61e51ba13bdded64c273c278e50850ae3bff073", 0],
    // cetus_clmm_pool_usdc_ausd
    ["0x0fea99ed9c65068638963a81587c3b8cafb71dc38c545319f008f7e9feb2b5f8", 0],

    // bluefin_pool_suiusdt_usdc
    ["0x62af128423465822e5a0979ccad2b0b5ee50a58c6a2c8ea3dd7fda1cda3cfbe7", 1],
    // bluefin_pool_stsui_sui
    ["0x4746414e445cebdc19666b6e4de9b79a46ca7bcaa894bf10ec230e649376356e", 1],
    // bluefin_pool_buck_usdc
    ["0x9f70edecd4af60ca9ce5544530cc5596a7d3a93d6a8c5207241f206e73384797", 1],
    // bluefin_pool_lbtc_suiwbtc
    ["0x715959c4a67cc6b8d2d4c0db628618d947a032041453a24c3a5315beb613331a", 1],
])


// key : worker_info_id,  
// value : 0: cetus clmm 
//         1: cetus stable farm
//         2: bluefin 
export const MOLE_WORKER_INFO_LIST = new Map([
    // cetus_worker_wusdc_sui_worker_info: 
    ["0x98f354c9e166862f079aaadd5e85940c55c440a8461e8e468513e2a86106042c", 0],
    // cetus_worker_sui_wusdc_worker_info: 
    ["0x3d946af3a3c0bec5f232541accf2108b97326734e626f704dda1dfb7450deb4c", 0],
    // cetus_worker_usdt_wusdc_worker_info:
    ["0x3f99d841487141e46602424b1b4125751a2df29a23b65f6c56786f3679f2c2c1", 0],
    // cetus_worker_wusdc_usdt_worker_info:
    ["0xc28878cfc99628743b13eebca9bdff703daeccb285f8c6ea48120b06f4079926", 0],
    // cetus_worker_weth_wusdc_worker_info:
    ["0xbeb69ca36f0ab6cb87247a366f50aab851180332216730e63e983ca0e617f326", 0],
    // cetus_worker_wusdc_weth_worker_info:
    ["0x1774ca4f9e37f37c6b0df9c7f9526adc67113532eb4eaa07f36942092c8e5f51", 0],
    // cetus_worker_usdt_sui_worker_info: 
    ["0x9a510e18c37df3d9ddfe0b2d6673582f702bf281116a4ee334f7ef3edfa2b9ab", 0],
    // cetus_worker_sui_usdt_worker_info:
    ["0xcd00ff33e9a71ea807f41641d515449263a905a850a4fd9c4ce03203c0f954b5", 0],
    // cetus_worker_sui_cetus_worker_info:
    ["0x83d7639b08ffc1408f4383352a2070b2f58328caa7fbbdfa42ec5f3cf4694a5d", 0],
    // cetus_worker_cetus_sui_worker_info:
    ["0xb690a7107f198c538fac2d40418d1708e08b886c8dfbe86c585412bea18cadcb", 0],
    // cetus_worker_cetus_wusdc_worker_info:
    ["0x88af306756ce514c6a70b378336489f8773ed48f8880d3171a60c2ecb8e7a5ec", 0],
    // cetus_worker_wusdc_cetus_worker_info:
    ["0xd093219b4b2be6c44461f1bb32a70b81c496bc14655e7e81d2687f3d77d085da", 0],
    // cetus_worker_hasui_sui_worker_info:
    ["0xed1bc37595a30e98c984a1e2c4860babf3420bffd9f4333ffc6fa22f2f9099b8", 0],
    // cetus_worker_sui_hasui_worker_info:
    ["0xc792fa9679b2f73d8debad2963b4cdf629cf78edcab78e2b8c3661b91d7f6a45", 0],
    // cetus_worker_navx_sui_worker_info: 
    ["0x262272883f08b1979d27a76f699f1e5020146c1a30213548bf89ccef62d583e1", 0],
    // cetus_worker_sui_navx_worker_info: 
    ["0xbc8b30dd02b349ebf6ee6b5454430c8f2c41206e2067aab251578155c7c7dc7e", 0],
    // cetus_worker_navx_cetus_worker_info: 
    ["0x1f8890445e538586657b721ff94b80435296d98bb5a3b984e07d5d326d6dfb3d", 0],
    // cetus_worker_cetus_navx_worker_info:
    ["0x8eeaa512683fff54710fd3e2297b72ef0f6d0f2c52c63720eac791b74f1a47c6", 0],
    // cetus_worker_sca_sui_worker_info:
    ["0x9f3086aaa1f3790b06bb01c0077d0a709cdb234fbae13c70fa5fdeafacb119aa", 0],
    // cetus_worker_sui_sca_worker_info:
    ["0x7a41fbf19809f80fd1a7282b218ec8326dfaadc2ad20604d052c12d5076596b4", 0],
    // cetus_worker_wusdc_wbtc_worker_info: 
    ["0xb0259f15a3c6e40883e85c559b09172c546dc439717347b936d9e1f1559ad53a", 0],
    // cetus_worker_wbtc_wusdc_worker_info: 
    ["0x99d6a5dad2b4b840d28ea88cc8fb599f4eb54a897bd3573957c8fbefa8e252ac", 0],
    // cetus_worker_buck_wusdc_worker_info: 
    ["0x1a8ad1068ab9bc5b94f2e3baa7a5eaac67e1337e2a47463fcfbc1b9ed26ef5ce", 0],
    // cetus_worker_wusdc_buck_worker_info: 
    ["0xf7fc938356331d7404226c147328750cf2d8ef8a273ed8bc1450ee4e0ff0e659", 0],
    // cetus_worker_usdc_sui_worker_info: 
    ["0x44bff32bda79532beafeb35ce80f5673b03bc3411229b6bb55d368827271ea9f", 0],
    // cetus_worker_sui_usdc_worker_info: 
    ["0x18d1556fddf2eaacfe922b3ce3a3c339d19363d190b3e0c22b6291ab1cf57d6c", 0],
    // cetus_worker_usdc_usdt_worker_info: 
    ["0xc3f471085526079f294d8395cc078393a7e7f8f750d6d7871679c58bfab38ac8", 0],
    // cetus_worker_usdt_usdc_worker_info: 
    ["0x354808fb8a29a59e35e2d9bf06892eb913d750796b71b5f72efa6cd9d5dbbc27", 0],
    // cetus_worker_cetus_usdc_worker_info: 
    ["0x7b62b4ea193bb6abf99380b3ad341db84ee28c289bf624c16fb6e7eed21ae988", 0],
    // cetus_worker_usdc_cetus_worker_info: 
    ["0x5dfdcaaa330e31605b8444f0d65d3e46fd2d0f4addf44d2284d05b1225ab2dca", 0],
    // cetus_worker_usdc_wusdc_worker_info: 
    ["0x6b65414a6244fdbd71d0e1fc8e0a27c717f68db51faf5a7cce7256abae9a320e", 0],
    // cetus_worker_wusdc_usdc_worker_info: 
    ["0x9b0e6176f25aeff94388fcf2c7d98ca481997f9e08160875263c4c50b669d242", 0],
    // cetus_worker_usdc_buck_worker_info: 
    ["0x1c0a2e9e57e51b8f3557c3a6a1163b4909d9a14516ad7ecf7dd7814e7328d6fc", 0],
    // cetus_worker_buck_usdc_worker_info: 
    ["0x05d0e4b408c1a66bc7ed21a591970962f7e60ebc569a35ff1c61cbb2cdbf3832", 0],
    // cetus_worker_buck_sui_worker_info: 
    ["0xae7c55844e42ef1296af174ae10c247d091fd6be87a718a34af2f9dffaf05fc8", 0],
    // cetus_worker_sui_buck_worker_info: 
    ["0x89a808d0ba894599b89e7d8010682ce937af991fafebecb11667bb11d407d8c3", 0],
    // cetus_worker_usdc_wusdc_worker_info: 
    ["0x27e235491f516aaa2b6d7a4b1fd402a518f3da93d1e208ec9e7c072b4cf32e0a", 0],
    // cetus_worker_wusdc_usdc_worker_info:
    ["0x6759e2cb781a5a4f47b8b55684b1ab87ba46a7ff770a3e2f2c42cf94fb306d76", 0],
    // cetus_worker_buck_wusdc_worker_info:
    ["0xee0430bce1e4ba2802719000300d9f5f1f179554669ca96b594b2ffa501b92d2", 0],
    // cetus_worker_wusdc_buck_worker_info: 
    ["0x57a70d4108b54e2b8b8f1a327975ae222d16eaf006eba90f479a3fce857cb5b1", 0],
    // cetus_worker_usdc_suiusdt_worker_info: 
    ["0x090d1bbf706bfdb00dfa7f2faeba793ccff87c2845f23312ed94c3f6a5aa02fd", 0],
    // cetus_worker_suiusdt_usdc_worker_info: 
    ["0xe9c2b3d537084d20c1cb6c61f567f4b7f38aa890db8b76a92e5ebab3625fb3d3", 0],
    // cetus_worker_fdusd_usdc_worker_info:
    ["0xa04a6445403ad44a23d9828db39057d08580689db40dc413919c5e13af94f395", 0],
    // cetus_worker_usdc_fdusd_1_worker_info: 
    ["0x85b95d5c30f481e45e51493771140d11ccdd28ca8fdf2a9abb0431d31b7298d0", 0],
    // cetus_worker_usdc_fdusd_2_worker_info: 
    ["0xf658a0a9eb06b349a5493100094066c0b3548c18545ae5b7607748d1dcb997ca", 0],
    // cetus_worker_usdc_fdusd_3_worker_info: 
    ["0x2ce694787928598ad30daf85d68b26d1fb4e271385201576f76a81381281e843", 0],
    // cetus_worker_usdc_fdusd_4_worker_info: 
    ["0x0547da166a7dbc7fa9f6c67c48e20651fbbe748f4eb4be984f4062889e3a837c", 0],
    // cetus_worker_usdc_fdusd_5_worker_info: 
    ["0x0c4e2689734925f4d760d4feb91e32542d67a56a27f62896ce2f682bb72bea90", 0],
    // cetus_worker_usdc_fdusd_6_worker_info: 
    ["0x8c0684fa6a81c15f2956e5d01b66a8794182935c400fad9b78414db2e0127b98", 0],
    // cetus_worker_usdc_usdy_worker_info: 
    ["0xf823b1460defefa6f3923e4f4eb93795f421756de29afed344ddd6d6dd91be29", 0],
    // cetus_worker_usdy_usdc_worker_info: 
    ["0x3ef9304468faecfaf7d2317960b9e69fb85ea2610cc089244f3c0d54abf167e7", 0],
    // cetus_worker_stablefarm_hasui_sui_worker_info: 
    ["0x4e0f84b2d00700102553482e46ec08bd65b29e0d4fc9af8b39b0b25e299fcf1f", 1],
    // cetus_worker_stablefarm_sui_hasui_worker_info: 
    ["0x9af96eeb7ca6c1d17cad76607cd04b4ee712908345b64d66e9d3df9f053c5b82", 1],
    // cetus_worker_usdc_suiusdt_2_worker_info:
    ["0xc602fd3f71b40e8ba3c7e01f8e42987cfb660e282fc645952d03ae59a075aea2", 0],
    // cetus_worker_suiusdt_usdc_2_worker_info: 
    ["0x01faaad863c448800d2b7223609436c2cdf001c4c397d66eb59bb89a82828b6d", 0],
    // cetus_worker_usdc_ausd_worker_info:
    ["0xceba2697cb06fd3f1b5647bc192f30a96749ee43262ff4bd7ea9d5a2d00cee40", 0],
    // cetus_worker_ausd_usdc_worker_info:
    ["0x989baaba20b51b6aec07bd0c235ee9a2ee3e709071d34c547abf84841b4a5d5b", 0],
    
    // -- - after cetus --- 
      
    // cetus_worker_usdc_suiusdt_2_worker_info: 
    ["0x85ad5f6b8dd39b2a9dbb05161a563db52f91d724390273a739199dbfa640405b", 0],
    // cetus_worker_suiusdt_usdc_2_worker_info:
    ["0x888821cfa0e8d3e4de4602d91b17ea2e156e534a233424611b8f27e5d4bac439", 0],
    // cetus_worker_usdc_buck_worker_info:
    ["0x567032b6d5a37897662294c6442d893ba3e5dfcd16ed7b1a6ccf8e69ae7de288", 0],
    // cetus_worker_buck_usdc_worker_info:
    ["0xaee16401df87f6c7dbe6397c960f6b7993f9d005e9d11cbda8f4d079e94cde8a", 0],
    // cetus_worker_stablefarm_hasui_sui_worker_info:
    ["0x19d8089f3168a7f07d0aca36ea428585025d64ce4aeeb8cdf50ee72213ef07da", 1],
    // cetus_worker_stablefarm_sui_hasui_worker_info:
    ["0x47b2a1ad2a87de3351f8e7d7ce39b529a15af53e7b4ba89c8c69781ba2f6829f", 1],
    // bluefin_worker_suiusdt_usdc_worker_info: 
    ["0x12552c511257169cba63a0b2159e812d5fe578781ec051435063b346b5c05f03", 2],
    // bluefin_worker_usdc_suiusdt_worker_info:
    ["0x235e04373fb6799990ae1c148257fcd8ce68e99fd67a70d5250e398615a7051c", 2],
    // bluefin_worker_stsui_sui_worker_info:
    ["0x8a1068568ccbd45262feea49a22d0ed42a28969e9fc0720ceb2306c838f9832f", 2],
    // bluefin_worker_sui_stsui_worker_info:
    ["0x66f72cf2babece8f8bdfd7b370be35de5bd9fc67c7a13f45332149a213db5298", 2],
    // bluefin_worker_buck_usdc_worker_info
    ["0x218c06ec2ae747e889ca5720e603272f49fb3724a5777b0c3a8e7ea6dd2e5f9e", 2],
    // bluefin_worker_lbtc_suiwbtc_worker_info
    ["0xe4297de0dda97bd2843badee6a621cf4eba631222c58ea7d3b686ca42ddb81c6", 2],
    // bluefin_worker_usdc_suiusdt_2_worker_info
    ["0xc2512435e24509da820b17b836202830542baa94c4872ca37d832c8193f38b5f", 2],
    // bluefin_worker_suiusdt_usdc_worker_info: 
    ["0x35c02931d9645134c87178173df047a0a71e4324597f14368606af766e0be863", 2],
])