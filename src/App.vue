<template>
  <div class="wrapper">
    <div class="title">xPortal Hub Test</div>

    <drop-wallet v-if="!address" class="wallet" @wallet="onWalletChange"></drop-wallet>

    <sign-transactions v-else-if="signRequest" :tab-id="tabId" :transactions="transactions"></sign-transactions>

    <div class="wallet" v-else>
      <div class="wallet__address">
        <obfuscated-address :value="address?.bech32()" />
        <span class="cta cta-warning logout" @click="logout()">Logout</span>
      </div>
      <div class="login" @click="login()">
        <div class="cta cta-main">Login in the current tab</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import DropWallet from "@/components/DropWallet.vue";
import SignTransactions from "@/components/SignTransactions.vue";
import {useWallet} from "@/WalletManager";
import { onMounted, ref} from "vue";
import ObfuscatedAddress from "@/components/ObfuscatedAddress.vue";

const { address, transactions, updateWallet, load, logout, generateNativeToken, transactionDetail } = useWallet();
async function onWalletChange(wallet: string) {
  console.log("wallet", wallet);
  chrome.storage.local.set({ wallet }).then(() => {
    updateWallet(wallet);
  });
}

async function login() {
  const token = await generateNativeToken();
  console.log("token", token);
  chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
    console.log("Tab", tabs)
    const [tab] = tabs;
    if(!tab?.url) return;
    const separator = tab.url.includes("?") ? "&" : "?";
    const url = `${tab.url}${separator}accessToken=${token}`;
    console.log("Update url", url);
    chrome.tabs.update(tab.id, { url });
  });
}



window.addEventListener("message", async (event) => {
  if(!event.data) return;

  try {
    const eventData = JSON.parse(event.data);
    if(!eventData?.type || eventData.type !== 'SIGN_TRANSACTIONS_REQUEST') {
      return;
    }
    transactions.push(eventData.message);
  } catch(err) {
    //Silent catch JSON parse error
    console.log("Error parsing message from xPortal Hub", err)
  }
});

const signRequest = ref(false);
const tabId = ref(0);
function readSignRequest() {
  const search = typeof window !== 'undefined' ? window?.location?.search : '';
  const urlSearchParams = new URLSearchParams(search) as any;
  const searchParams = Object.fromEntries(urlSearchParams);

  signRequest.value = searchParams?.signRequest !== undefined;
  tabId.value = searchParams?.tabId;
  console.log("signRequest", searchParams, signRequest.value, tabId.value)
}
onMounted(() => {
  readSignRequest();
  load();
  window.onblur = () => {
    //TODO : send cancel message
    //window.close();
  }
});
</script>
<style lang="scss">
@import "src/sass/app";
.wrapper {
  width: 100%;
  height: 100%;
  background-color: #000;
  color: azure;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  background: aquamarine;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #414141;
  width: 100%;
  height: 20%;
  border-bottom-left-radius: 5%;
  border-bottom-right-radius: 5%;
  box-shadow: #4e9d81 0 4px 4px 0;
  margin-bottom: 20px;
}

.wallet {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__address {
    margin-top: 10px;
  }

}

.login {
  display: flex;
  margin-top: 40px;
  font-size: 1.5rem;
  height: 40%;
  align-items: center;
  justify-content: center;
}

.logout {
  padding: 5px;
  margin-left: 10px;
}

</style>
