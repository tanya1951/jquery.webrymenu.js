/*
 * jquery.webrymenu.js v1.0.3
 * https://github.com/webryone/jquery.webrymenu.js/
 * 
 * MIT licensed
 * Copyright (C) 2014 Kohei Katada, http://webryone.jp/jquery-plugin/webrymenu/, https://twitter.com/webryone
 */

;
(function ($) {

    $.fn.webryMenu = function (option) {

        var _elem = this,

        // オプション初期化
        _option = {
            enable3d:           option.enable3d || false,
            rotateX:            option.rotateX || "0deg",
            rotateY:            option.rotateY || "45deg",
            transformOrigin:    option.transformOrigin || "left center",
            perspective:        option.perspective || "3000px",
            duration:           option.duration || 500,
            delay:              option.delay || 0,
            easing:             option.easing || "linear",
            windowBreakPoint:   parseInt(option.windowBreakPoint, 10) || 769,
            width:              option.width || "65%",
            position:           option.position || "absolute",
            top:                option.top || 0,
            zIndex:             option.zIndex || 9999,
            overlayBgColor:     option.overlayBgColor || "#000",
            overlayOpacity:     option.overlayOpacity || 0.4,
            toggleElementId:    option.toggleElementId || "#toggleWebryMenu",
            contentsWrapperId:  option.contentsWrapperId || "#pageWrapper",
            func_open:          option.completeOpened || function(){},
            func_close:         option.completeClosed || function(){}
        },

        hasTouch = ("ontouchstart" in window) ? true : false,   //タッチデバイスの判定

        clickEvt = (hasTouch) ? "touchstart" : "click", //クリックイベントの文字列

        resizeEvt = ("onorientationchange" in window) ? "orientationchange" : "resize", //リサイズイベントの文字列

        checkBrowser = function () {
            var ua = window.navigator.userAgent;
            if      ( /chrome/i.test(ua) )   { return "Chrome";  }
            else if ( /safari/i.test(ua) )   { return "Safari";  }
            else if ( /firefox/i.test(ua) )  { return "Firefox"; }
            else if ( /opera/i.test(ua) )    { return "Opera";   }
            else if ( /getcko/i.test(ua) )   { return "Gecko";   }
            else if ( /msie/i.test(ua) )     { return "IE";      }
            else if ( (/android/gi).test(window.navigator.appVersion) )     { return "Android";   }
            else if ( (/iphone|ipad/gi).test(window.navigator.appVersion) ) { return "iOSdevice"; }
            else if ( (/hp-tablet/gi).test(window.navigator.appVersion) )   { return "touchPad";  }
            else { return null; }
        },

        vendorPrefix = function () {
            switch ( checkBrowser() ) {
                case "Android"   : return "-webkit-"; break;
                case "iOSdevice" : return "-webkit-"; break;
                case "touchPad"  : return "-webkit-"; break;
                
                case "Chrome"    : return "-webkit-"; break;
                case "Safari"    : return "-webkit-"; break;
                case "Firefox"   : return "-moz-";    break;
                case "Opera"     : return "-o-";      break;
                case "IE"        : return "-ms-";     break;
                case null        : return "";         break;
            }
        },

        changeCssPropToJsRef = function (_cssProp) {
            return _cssProp.replace(/-./g, function (s) { return s.charAt(1).toUpperCase(); });
        },

        changeCss3PropToJsRef = function (_cssProp) {
            var dummyElem = document.createElement("div");
            if ( !(changeCssPropToJsRef(_cssProp) in dummyElem.style) ) {
                dummyElem = null;
                return changeCssPropToJsRef( vendorPrefix() + _cssProp );
            } else {
                dummyElem = null;
                return changeCssPropToJsRef(_cssProp);
            }
        },

        has3d = function () {
            var dummyElem = document.createElement("div");
            if ( changeCss3PropToJsRef("perspective") in dummyElem.style ) {
                dummyElem = null;
                return true;
            } else {
                dummyElem = null;
                return false;
            }
        },

        monitoringWindowExeFlag = false,
        newId,

        // ウインドウリサイズ監視関数
        monitoringWindow = function () {
            if ( $(this).width() <= _option.windowBreakPoint ) {    //指定したウインドウ幅以下の場合に
                if ( !monitoringWindowExeFlag ) {
                    // 要素をクローン
                    var cloneElem = _elem.clone();

                    // 要素を非表示
                    _elem.css("display", "none");
                    
                    // クローンした要素のIDを変更
                    newId = cloneElem.prop("id") + "_WEBRYMENU";
                    cloneElem.prop("id", newId);

                    // クローンした要素をDOMに追加
                    $("body").append(cloneElem);

                    // DOMに追加した要素のstyleを設定
                    $("#"+newId).css({
                        width:          _option.width,
                        height:         $(window).height()+"px",
                        "overflow-y":   "scroll",
                        position:       _option.position,
                        top:            _option.top,
                        "z-index":      _option.zIndex
                    });

                    (hasTouch) && $("#"+newId).css("-webkit-overflow-scrolling", "touch");  //タッチデバイス時に慣性スクロールを有効にする

                    monitoringWindowExeFlag = true;
                }

                $("#"+newId).css({
                    left:   -$(this).width()+"px",    // 常にクローンした要素の右端を画面の左端に追従させる
                    height: $(window).height()+"px" //常にクローンした要素の高さをウインドウの高さに合わせる
                });

                $("#"+_option.contentsWrapperId.substr(1)+"_overlay").css({
                    height: $(window).height()+"px" //常にオーバーレイ要素の高さをウインドウの高さに合わせる
                });

                (toggleOnFlag) && toggleSideMenu(); //サイドメニューが開いているときにサイドメニューを閉じる

            } else {    //指定したウインドウ幅以上の場合に
                if ( monitoringWindowExeFlag ) {
                    // サイドメニューの要素を削除
                    $("#"+newId).remove();

                    // 要素を非表示
                    _elem.css("display", "block");

                    monitoringWindowExeFlag = false;
                }
            }
        },

        // CSS3プロパティをJSリファレンス名に変換
        transitionProp  = changeCss3PropToJsRef("transition"),
        transformProp   = changeCss3PropToJsRef("transform"),

        // メニュー開閉判定フラグ
        toggleOnFlag    = false,    //trueならサイドメニューを閉じる。falseならサイドメニューを開く。

        // メニュー開閉関数
        toggleSideMenu = function () {
            // ページラッパーにオーバーレイ
            if ( !toggleOnFlag ) {  //サイドメニュー開いたとき
                // ドキュメントスクロール禁止
                $("body").css("overflow", "hidden");

                // 要素を生成
                var dom = $("<div id='"+_option.contentsWrapperId.substr(1)+"_overlay"+"' style='display: none;'>");
                // 生成した要素をページラッパー内に追加
                $(_option.contentsWrapperId).append(dom);
                // 追加した要素のstyleを設定
                $("#"+_option.contentsWrapperId.substr(1)+"_overlay").css({
                    position:           "absolute",
                    "z-index":          _option.zIndex,
                    top:                0,
                    left:               0,
                    width:              "100%",
                    height:             ( $(_option.contentsWrapperId).height() <= $(window).height() ) ? $(window).height()+"px" : $(_option.contentsWrapperId).height()+"px",
                    "background-color": _option.overlayBgColor,
                    opacity:            _option.overlayOpacity
                })
                .fadeIn(_option.duration);  // fadeIn

                var windowScrollTop = $(window).scrollTop();    //ウインドウのスクロールトップ値

                // サイドメニューとオーバーレイの上端をウインドウの上端にする
                $("#"+_option.contentsWrapperId.substr(1)+"_overlay").css("top", windowScrollTop+"px"); // オーバーレイ
                $("#"+newId).css("top", windowScrollTop+"px");  // サイドメニュー

            } else {    //サイドメニュー閉じたとき
                // ドキュメントスクロール許可
                $("body").css("overflow", "visible");

                $("#"+_option.contentsWrapperId.substr(1)+"_overlay")
                .fadeOut(_option.duration, function () {    // fadeOut
                    $(this).remove();   //削除
                });
            }

            // ページラッパーをアニメーション
            var transformValue,
            pageWrapperSlidePx = (toggleOnFlag) ? ("0px"): ($("#"+newId).width()+"px");

            if ( has3d() ) {    //3D系対応なら
                if ( _option.enable3d ) {   //3dオプション trueなら

                    transformValue
                    = (toggleOnFlag)
                    ? "translateX(0px) rotateX(0deg) rotateY(0deg)"
                    : "translateX("+pageWrapperSlidePx+") rotateX("+_option.rotateX+") rotateY("+_option.rotateY+")";

                    // 3Dプロパティを適用
                    $(_option.contentsWrapperId).parent()[0].style[changeCss3PropToJsRef("perspective")] = _option.perspective;
                    $(_option.contentsWrapperId)[0].style[changeCss3PropToJsRef("transform-style")]      = "preserve-3d";
                    $(_option.contentsWrapperId)[0].style[changeCss3PropToJsRef("transform-origin")]     = _option.transformOrigin;
                    
                } else {    //3dオプション falseなら
                    transformValue = "translateX("+pageWrapperSlidePx+")";
                }

                // CSS3アニメーション
                $(_option.contentsWrapperId)[0].style[transformProp]    = transformValue;
                $(_option.contentsWrapperId)[0].style[transitionProp]   = vendorPrefix()+"transform"+" "+_option.duration+"ms"+" "+_option.delay+"ms"+" "+_option.easing;
            } else {    //3D未対応なら
                //jQueryアニメーション
                $(_option.contentsWrapperId).animate(
                {
                    left: pageWrapperSlidePx
                },
                {
                    duration: _option.duration,
                    delay:    _option.delay,
                    easing:   _option.easing
                });
            }

            // サイドメニューをアニメーション
            var sideMenuSlidePx = (toggleOnFlag) ? (parseInt($("#"+newId).css("left"), 10)+"px"): (-parseInt($("#"+newId).css("left"), 10)+"px");

            // コールバック関数
            var callbackFunc = ( !toggleOnFlag ) ? _option.func_open : _option.func_close;

            if ( has3d() ) {    //3D系対応なら
                // コールバックを削除 & 実行
                var _handle = function () {
                    // コールバックを削除
                    $("#"+newId).off( "webkitTransitionEnd", _handle );
                    $("#"+newId).off(    "MozTransitionEnd", _handle );
                    $("#"+newId).off(    "mozTransitionEnd", _handle );
                    $("#"+newId).off(     "msTransitionEnd", _handle );
                    $("#"+newId).off(      "oTransitionEnd", _handle );
                    $("#"+newId).off(       "transitionEnd", _handle );
                    $("#"+newId).off(       "transitionend", _handle );
                    // コールバックを実行
                    ( typeof callbackFunc === "function" ) && callbackFunc();
                };
                // コールバックを登録
                $("#"+newId).on( "webkitTransitionEnd", _handle );
                $("#"+newId).on(    "MozTransitionEnd", _handle );
                $("#"+newId).on(    "mozTransitionEnd", _handle );
                $("#"+newId).on(     "msTransitionEnd", _handle );
                $("#"+newId).on(      "oTransitionEnd", _handle );
                $("#"+newId).on(       "transitionEnd", _handle );
                $("#"+newId).on(       "transitionend", _handle );
                
                // CSS3アニメーション
                $("#"+newId)[0].style[transformProp]    = "translateX("+sideMenuSlidePx+")";
                $("#"+newId)[0].style[transitionProp]   = vendorPrefix()+"transform"+" "+_option.duration+"ms"+" "+_option.delay+"ms"+" "+_option.easing;
            } else {    //3D未対応なら
                //jQueryアニメーション
                $("#"+newId).animate(
                {
                    left: (toggleOnFlag) ? (-$("#"+newId).width()+"px"): "0px"
                },
                {
                    duration: _option.duration,
                    delay:    _option.delay,
                    easing:   _option.easing,
                    complete: function () { ( typeof callbackFunc === "function" ) && callbackFunc(); }
                });
            }

            toggleOnFlag = (toggleOnFlag) ? false: true;

            if ( toggleOnFlag ) {   //サイドメニューを開いたとき
                if ( hasTouch ) {   //タッチデバイスなら
                    // ドキュメントスクロール禁止
                    $("#"+_option.contentsWrapperId.substr(1)+"_overlay").one( "touchmove.noScroll_overlay", function (e) {
                        e.preventDefault();
                    });
                }

                // ページラッパー領域をクリック時にサイドメニューを閉じるイベントを設定
                $("#"+_option.contentsWrapperId.substr(1)+"_overlay").one( clickEvt, toggleSideMenu );
            }
        };

        // メイン
        $(window).one( "load", monitoringWindow );    // ウインドウ読み込み監視
        $(window).on( resizeEvt, monitoringWindow );    // ウインドウリサイズ監視

        $(_option.toggleElementId).on( clickEvt, toggleSideMenu );    // トグルボタンのイベントハンドラ

        return this;
    };

})(jQuery);
