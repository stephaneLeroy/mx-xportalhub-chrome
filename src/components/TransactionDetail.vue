<template>
        <div class="transaction" :class="{ 'transaction__danger': isMainnet }" v-if="transaction">
            <div class="transaction__info">
                <div class="transaction__label">Chain Id</div>
                <div class="transaction__data">{{chainId}}</div>
            </div>
            <div class="transaction__info">
                <div class="transaction__label">Value</div>
                <div class="transaction__data">{{value}}</div>
            </div>
            <div class="transaction__info">
                <div class="transaction__label">Data</div>
                <div class="transaction__data">{{transaction.getData()}}</div>
            </div>
            <div class="transaction__info">
                <div class="transaction__label">To</div>
                <div class="transaction__data"><obfuscated-address :value="transaction.getReceiver().bech32()"/></div>
            </div>
            <div class="transaction__info" v-if="isMainnet">
                <div>DANGER ZONE : Mainnet Transaction!!</div>
            </div>
        </div>
</template>
<script lang="ts" setup>
import {computed, PropType} from "vue";
import {TokenTransfer, Transaction} from "@multiversx/sdk-core/out";
import ObfuscatedAddress from "@/components/ObfuscatedAddress.vue";

const props = defineProps({
    transaction: {
        type: Object as PropType<Transaction>,
        required: true
    }
});

const chainId = computed(() => {
    switch(props.transaction.getChainID()) {
        case '1':
            return "Mainnet"
        case 'T':
            return "Testnet"
        case 'D':
            return "Devnet"
        default:
            return "Unknown network?"
}});

const isMainnet = computed(() => {
    return props.transaction.getChainID() === '1';
});

const value = computed(() => {
    return TokenTransfer.egldFromBigInteger(props.transaction.getValue()).toPrettyString();
});
function openUrl(url: string) {
    chrome.tabs.create({ url });
}
</script>
<style lang="scss">
.transaction {
    margin-left: 10px;
    margin-right: 10px;

    &__danger {
        background: #ff0000;
    }

    &__info {
        display: flex;
        flex-direction: row;
        gap: 4px;
        align-items: center;
    }

    &__label {
        background: aquamarine;
        color: black;
        padding: 4px;
        border: 1px solid black;
        margin-right: 4px;
        min-width: 20%;
        height: 100%;
    }

    &__data {
        padding: 4px;
        background: #414141;
        width: 80%;
        inline-size: 80%;
        height: 100%;
        overflow: auto;
    }
}

</style>