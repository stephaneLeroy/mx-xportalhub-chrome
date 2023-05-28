<template>
    <div class="token__configuration">
        <div class="token__configuration-item">
            <label for="ttl">TTL (seconds)</label>
            <input id="ttl" v-model="ttl" type="number"/>
        </div>
        <div class="token__configuration-item">
            <label for="origin">Origin</label>
            <input id="origin" v-model="origin" type="url"/>
        </div>
    </div>
</template>
<script lang="ts" setup>
import {useWallet} from "@/WalletManager";
import {onMounted} from "vue";

const { ttl, origin, loadTokenConfig } = useWallet();

onMounted(async () => {
    await loadTokenConfig();
});
</script>
<style lang="scss">
.token__configuration {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    padding-right: 14px;
    padding-left: 14px;
    width: 100%;

    &-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-end;
        width: 100%;

        label {
            flex: 1;
            justify-content: right;
            margin-bottom: 5px;
            margin-right: 5px;
            font-size: 0.9rem;
        }

        input {
            flex: 2;
            height: 30px;
            border-radius: 5px;
            border: 1px solid #414141;
            font-size: 1rem;
        };
    }
}
</style>