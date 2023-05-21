<template>
    <div class="sign__transaction">
        <div class="sign__transaction-ctas">
            <div class="cta cta-main" @click="signAndSendTransactions()">Sign Transaction(s)</div>
            <div class="cta cta-warning" @click="sendError()">Generate error</div>
        </div>

        <transactions-list :transactions="transactions"></transactions-list>
    </div>
</template>
<script lang="ts" setup>
import type {PropType} from "vue";
import {Transaction} from "@multiversx/sdk-core/out";
import {useWallet} from "@/WalletManager";
import TransactionsList from "@/components/TransactionList.vue";
import {onMounted} from "vue";

const props = defineProps({
    tabId: {
        type: Number,
        required: true
    },
    transactions: {
        type: Array as PropType<Transaction[]>,
        required: true
    }
});

const { signTransactions } = useWallet();

async function signAndSendTransactions() {
    try {
        console.log("signAndSendTransactions")
        const result = await signTransactions(props.transactions as Transaction[]);

        if (!result || result.error) {
            console.log("Return error", result?.error)
            await chrome.runtime.sendMessage( {tabId: props.tabId, type: 'SIGN_TRANSACTIONS_RESPONSE', message: {error : result?.error}});
        } else {
            console.log("Return signed transactions", result.transactions)
            await chrome.runtime.sendMessage( { tabId: props.tabId, type: 'SIGN_TRANSACTIONS_RESPONSE', message: {transactions: result.transactions}});
        }
        await chrome.storage.local.set({response: true})
    } catch (err) {
        console.log("Error signing transaction", err);
        await chrome.runtime.sendMessage({tabId: props.tabId, type: 'SIGN_TRANSACTIONS_RESPONSE', message: {error: err.message}});
    } finally {
        window.close();
    }
}

async function sendError() {
    await chrome.runtime.sendMessage({tabId: props.tabId, type: 'SIGN_TRANSACTIONS_RESPONSE', message: {error: 'Generated error (xPortal Hub test extension)'}});
    window.close();
}

onMounted(() => {
    console.log("SignTransactions request", props.transactions);
});
</script>
<style lang="scss">
.sign__transaction {
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 100%;
    width: 100%;

    &-ctas {
        display: flex;
        flex-direction: row;
        gap: 4px;
        justify-content: center;
        margin-bottom: 8px;
    }
}
</style>