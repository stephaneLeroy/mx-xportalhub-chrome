<template>
    <div class="transactions">
        <transaction-detail  v-for="(transaction, index) in transactions" :key="index" :transaction="transaction"> </transaction-detail>
    </div>
</template>
<script lang="ts" setup>
import {PropType} from "vue";
import type {Transaction} from "@multiversx/sdk-core/out";
import TransactionDetail from "@/components/TransactionDetail.vue";

defineProps({
    transactions: {
        type: Array as PropType<Transaction[]>,
        required: true
    }
});
</script>
<style lang="scss">
.transactions {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
</style>