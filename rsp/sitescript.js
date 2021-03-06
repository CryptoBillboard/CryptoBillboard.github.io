/////////////////////////////////////////////////////////////////////////////////////
// 
//   VARIBLES
//
/////////////////////////////////////////////////////////////////////////////////////

"use strict";

const contractAddress = "n1xrmFg2XfbfVceoSC3yC798KR4zmabphit";
var nebulas = require("nebulas"),
    Account = nebulas.Account,
    Utils = nebulas.Utils,
    neb = new nebulas.Neb(),
    globalParams = {
        account: null
    };

/////////////////////////////////////////////////////////////////////////////////////
// 
//   INIT NEBULAS
//
/////////////////////////////////////////////////////////////////////////////////////

var net = "https://testnet.nebulas.io";
setNet(net); // sets the apiPrefix and other chain specific parameters into "localSave"

neb.setRequest(new nebulas.HttpRequest(localSave.getItem("apiPrefix")));
refreshDisplay();

uiBlock.insert({
    footer: ".footer",
    header: ".header",
    iconAddress: ".icon-address",
    logoMain: ".logo-main",
    numberComma: ".number-comma",
    selectWalletFile: [".select-wallet-file", onUnlockFile]
});

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
// onClickCallTest to test contract call
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function onClickCallTest(alsoExecute) {
    innerCall(function (params) {
        neb.api
            .call({
                from: params.from,
                to: params.to,
                value: params.value,
                nonce: params.nonce,
                gasPrice: params.gasPrice,
                gasLimit: params.gasLimit,
                contract: params.contract
            })
            .then(function (resp) {
                $("#call_test_result").text(JSON.stringify(resp));
                console.log("alsoExecute",alsoExecute);
                if (alsoExecute) {
                    onClickCall();
                }
                // onClickCall();
                // newGameId = resp["result"];
                if (resp.execute_err && resp.execute_err !== "") {
                    $("#call").attr("disabled", true);
                    $("#call_result").text("");
                    $(".next").removeClass("active1");
                } else {
                    $("#call").attr("disabled", false);
                    $("#call_result").text("");
                    $(".next").removeClass("active1");
                }
            })
            .catch(function (err) {
                console.log(err);
                $("#call_test_result").text(JSON.stringify(err));
                $("#call").attr("disabled", true);
                $("#call_result").text("");
                $(".next").removeClass("active1");
            });
    });
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
// onClickCall to submit contract call
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function onSubmitThrow() {
    onClickCallTest(true);
}

function onClickCall() {
    $(".modal.loading").modal("show");

    innerCall(function (params) {
        var gTx = new nebulas.Transaction(parseInt(localSave.getItem("chainId")),
            globalParams.account,
            params.to, params.value, params.nonce, params.gasPrice, params.gasLimit, params.contract);

        gTx.signTransaction();

        neb.api
            .sendRawTransaction(gTx.toProtoString())
            .then(function (resp) {
                console.log(JSON.stringify(resp));
                // showAlert(JSON.stringify(resp));
                $("#call_result").text(JSON.stringify(resp));
                $("#wallet-modal").modal("hide");
                showAlert("等候刷新！Refresh display in a minute after the chain has been verified!", "success");
                refreshDisplay();
                // $(".result").removeClass("active1");
                // $(".next").removeClass("active1");
                // $("#receipt_call").text(resp.txhash).prop("href", "check.html?" + resp.txhash);
                $(".modal.loading").modal("hide");
            })
            .catch(function (err) {
                console.log(JSON.stringify(err));
                // showAlert(JSON.stringify(err));
                $("#call_result").text(JSON.stringify(err));
                // $(".result").removeClass("active1");
                // $(".next").removeClass("active1");
                // $(".modal.loading").modal("hide");
            });
    });
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
// onUnlockFile
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function onUnlockFile(swf, fileJson, account, password) {
    var balance_nas, state,
        fromAddr = account.getAddressString(),
        $tab = $(swf).closest(".tab");

    $(".modal.loading").modal("show");

    $("#run_from_addr").val(fromAddr).trigger("input");
    // if ($tab.prop("id") == "tab2") {
    //     $("#from_addr").val(fromAddr).trigger("input");
    //     $("#to_addr").val(account.getAddressString()).trigger("input");
    // } else if ($tab.prop("id") == "tab3")
    //     $("#run_from_addr").val(fromAddr).trigger("input");

    try {
        account.fromKey(fileJson, password);
        globalParams.account = account;
        $("#unlock").hide();
        $("#send").show();

        neb.api.gasPrice()
            .then(function (resp) {
                $("#gas_price").val(resp.gas_price);
                $("#run_gas_price").val(resp.gas_price);
                console.log(resp);
                return neb.api.getAccountState(fromAddr);
            })
            .then(function (resp) {
                console.log(resp);
                var balance = nebulas.Unit.fromBasic(resp.balance, "nas");

                $("#run_balance").val(balance + " NAS");
                // if ($tab.prop("id") == "tab2")
                //     $("#balance").val(balance + " NAS");
                // else if ($tab.prop("id") == "tab3")
                //     $("#run_balance").val(balance + " NAS");
                showPostWallet();
                $(".modal.loading").modal("hide");
            })
            .catch(function (e) {
                // this catches e thrown by nebulas.js!neb

                bootbox.dialog({
                    backdrop: true,
                    onEscape: true,
                    message: i18n.apiErrorToText(e.message),
                    size: "large",
                    title: "Error"
                });

                $(".modal.loading").modal("hide");
            });
    } catch (e) {
        // this catches e thrown by nebulas.js!account
        console.log(e);

        bootbox.dialog({
            backdrop: true,
            onEscape: true,
            message: localSave.getItem("lang") == "en" ? e : "keystore 文件错误, 或者密码错误",
            size: "large",
            title: "Error"
        });

        $(".modal.loading").modal("hide");
    }
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
// innerCall
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function innerCall(callback) {
    let params = {};

    ////////////////////////////////////////////////////////////////////////////////
    // prepare from address
    
    if (!globalParams.account) {
        // TODO 提示钱包信息不正确
        return;
    }
    params.from = globalParams.account.getAddressString();


    ////////////////////////////////////////////////////////////////////////////////
    // prepare to address

    // let toAddr = $("#run_to_addr").val().trim();
    // if (!Account.isValidAddress(toAddr)) {
    //     $("#run_to_addr").addClass("err");
    //     setTimeout(function () {
    //         $("#run_to_addr").removeClass("err");
    //     }, 5000);
    //     return;
    // }
    // params.to = toAddr;

    if (!Account.isValidAddress(contractAddress)) {
        $("#run_to_addr").addClass("err");
        setTimeout(function () {
            $("#run_to_addr").removeClass("err");
        }, 5000);
        showAlert("Invalid contract address");
        return;
    }
    params.to = contractAddress;


    ////////////////////////////////////////////////////////////////////////////////
    // prepare gasLimit

    let gasLimit = Utils.toBigNumber(0);
    try {
        gasLimit = Utils.toBigNumber($("#run_gas_limit").val());
    } catch (err) {
        console.log(err);
        showAlert(err);
    }
    if (gasLimit.cmp(Utils.toBigNumber(0)) <= 0) {
        $("#run_gas_limit").addClass("err");
        setTimeout(function () {
            $("#run_gas_limit").removeClass("err");
        }, 5000);
        showAlert("gasLimit error");
        return;
    }
    params.gasLimit = gasLimit.toNumber();


    ////////////////////////////////////////////////////////////////////////////////
    // prepare gasPrice

    let gasPrice = Utils.toBigNumber(0);
    try {
        gasPrice = Utils.toBigNumber($("#run_gas_price").val());
    } catch (err) {
        console.log(err);
        showAlert(err);
    }
    if (gasPrice.cmp(Utils.toBigNumber(0)) <= 0) {
        $("#run_gas_price").addClass("err");
        setTimeout(function () {
            $("#run_gas_price").removeClass("err");
        }, 5000);
        showAlert("gasPrice error");
        return;
    }
    params.gasPrice = gasPrice.toNumber();

    ////////////////////////////////////////////////////////////////////////////////
    // prepare value

    var amountEntered = $("#run_value").val();

    let value = Utils.toBigNumber(0);
    try {
        value = nebulas.Unit.toBasic(Utils.toBigNumber(amountEntered), "nas");
    } catch (err) {
        console.log(err);
        showAlert(err);
    }
    if (value.cmp(Utils.toBigNumber(0)) < 0) {
        // TODO 添加提示value输入不对
        console.log("invalid value");
        showAlert("Invalid amount");
        return;
    }
    params.value = value;

    ////////////////////////////////////////////////////////////////////////////////
    // prepare contract
    
    var bidDisplay = $('#bid-display').val();
    var functionToCall = "bid";
    var argsToCall = JSON.stringify([bidDisplay]);
    console.log(bidDisplay, functionToCall, argsToCall);
    params.contract = {
        "function": functionToCall,
        "args": argsToCall
    };

    // Additional params to pass down

    ////////////////////////////////////////////////////////////////////////////////
    // prepare nonce
    // needs refresh data on every 'test' and 'commit' call, because data update may slow,
    // you can get different result by hit 'test' multiple times
    neb.api.getAccountState(params.from).then(function (resp) {
        var balance = nebulas.Unit.fromBasic(resp.balance, "nas"),
            $tab = $(".show.tab");

        params.nonce = parseInt(resp.nonce) + 1;

        $("#run_balance").val(balance + " NAS");
        // if ($tab.prop("id") == "tab2")
        //     $("#balance").val(balance + " NAS");
        // else if ($tab.prop("id") == "tab3")
        //     $("#run_balance").val(balance + " NAS");

        callback(params);
    }).catch(function (err) {
        console.log("prepare nonce error: " + err);
        // bootbox.dialog({
        //     backdrop: true,
        //     onEscape: true,
        //     message: i18n.apiErrorToText(err.message),
        //     size: "large",
        //     title: "Error"
        // });
    });
}

function setNet(net) {
    var i, len, apiList, langList,
        apiPrefix, sApiButtons, sApiText,
        lang, sLangButtons;

    localSave.setItem("apiPrefix", net)

    apiList = [
        { chainId: 1, name: "Mainnet", url: "https://mainnet.nebulas.io" },
        { chainId: 1001, name: "Testnet", url: "https://testnet.nebulas.io" },
        { chainId: 100, name: "Local Nodes", url: "http://127.0.0.1:8685"}
    ];
    apiPrefix = (localSave.getItem("apiPrefix") || "").toLowerCase();
    sApiButtons = "";

    for (i = 0, len = apiList.length; i < len && apiList[i].url != apiPrefix; ++i);

    i == len && (i = 0);
    localSave.setItem("apiPrefix", apiPrefix = apiList[i].url);
    localSave.setItem("chainId", apiList[i].chainId);
    sApiText = apiList[i].name;

    for (i = 0, len = apiList.length; i < len; ++i)
        sApiButtons += '<button class="' +
            (apiPrefix == apiList[i].url ? "active " : "") + 'dropdown-item" data-i=' + i + ">" +
            apiList[i].name + "</button>";
    //
    // lang

    langList = i18n.supports();
    lang = (localSave.getItem("lang") || "").toLowerCase();
    sLangButtons = "";

    for (i = 0, len = langList.length; i < len && langList[i] != lang; ++i);

    i == len && (i = 0);
    localSave.setItem("lang", lang = langList[i]);
}

/////////////////////////////////////////////////////////////////////////////////////
// 
//   ON LOAD and HANDLERS
//
/////////////////////////////////////////////////////////////////////////////////////

$(function() {
    $(document).on('.data-api');

    // Social Media
    var buttons = document.querySelectorAll(".social_share");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function() {
            return JSShare.go(this);
        }, false);
    }   
});

$("#call_test").on("click", onClickCallTest);
$("#call").on("click", onClickCall);

$("#submitCall").on("click", function() {
    onSubmitThrow();
});

/////////////////////////////////////////////////////////////////////////////////////
// 
//   Refresh Display
//
/////////////////////////////////////////////////////////////////////////////////////

function refreshDisplay() {
    var callParamsObj = {
        chainID: parseInt(localSave.getItem("chainId")),
        // chainID: 1001,
        from: "n1EdY7FnXvYqSG9zT68rnbBRfCXiXAVDfss",
        to: contractAddress,
        value: 0,
        // nonce: parseInt(state["nonce"])+1,
        gasPrice: 1000000,
        gasLimit: 200000,
        contract: {
            function: "current",
            args: "[]",
        }
    };
    console.log("refreshDisplay > callParamsObj", callParamsObj);
    neb.api.call(callParamsObj).then(function(tx) {
        console.log("refreshDisplay's > full result: ", tx);
        if (tx && tx["result"] != "") {
            var result = JSON.parse(tx["result"]);
            console.log("refreshDisplay's > result: ", result);
            updateDisplay(result);
        }
    }).catch((err) => {
        console.log(err);
        showAlert(err);
    });          
}

/////////////////////////////////////////////////////////////////////////////////////
// 
//   Functions
//
/////////////////////////////////////////////////////////////////////////////////////

function showPostWallet() {
    $(".post-wallet").show();
    $(".pre-wallet").hide();
}

function updateDisplay(result) {
    var normalizedBid = nebulas.Unit.fromBasic(result.current_bid, "nas");
    var normalizedBidStr = Utils.toBigNumber(normalizedBid).toString(10);
    $("#current-bid").text(result.current_bid);
    $("#current-data").text(result.current_data);
}

function showAlert(message, alertType) {
    if (alertType && alertType == "success") {
        $('#alert .modal-title').text("成功！Success!");
        $('#alert .alert-content').html(message);
    } else {
        $('#alert .modal-title').text("Error");
        $('#alert .alert-content').html(message);
    }
    $('#alert').modal({"backdroup": true});
}

function shortenAddress(address) {
    if (typeof address === 'string' && address.length > 20) {
        var length = 5;
        return address.substring(0, length) + "..." + address.substring(address.length-length);
    }
    return "...";
}
