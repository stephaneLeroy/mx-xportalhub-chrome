<template>
    <div class="drop__wallet">
        <div class="drop__wallet-zone"
             @drop.prevent="onDrop"
             @dragenter.prevent="() => hovering = true"
             @dragleave.prevent="() => hovering = false"
            :class="{ 'drop__wallet-zone-hover': hovering }">Drop a wallet PEM here</div>
        <div class="drop__wallet-warning">
            <p>
                Warning! PEM wallet are not safe, please do not use your main wallet!
            </p>
        </div>
    </div>
</template>
<script lang="ts" setup>
import {onMounted, onUnmounted, ref} from "vue";

const emit = defineEmits<{
    (event: 'wallet', wallet: string): void,
}>()

const hovering = ref(false);

async function onDrop(event) {
    console.log("wallet drop");
    const file = event.dataTransfer.files[0];
    const wallet = await file.text();
    emit('wallet', wallet)
}
function preventDefaults(e) {
    e.preventDefault()
}

const events = ['dragenter', 'dragover', 'dragleave', 'drop']

onMounted(() => {
    events.forEach((eventName) => {
        document.body.addEventListener(eventName, preventDefaults)
    })
})

onUnmounted(() => {
    events.forEach((eventName) => {
        document.body.removeEventListener(eventName, preventDefaults)
    })
})
</script>
<style lang="scss">
.drop__wallet{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    &-zone{
        width: 80%;
        height: 50%;
        background: wheat;
        border-radius: 8px;
        margin-top: 5%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.5rem;
        color: #414141;

        &-hover {
            border: dashed orange;
        }
    }
    &-warning{
        font-size: 1.3rem;
        text-align: center;
        margin-top: 10%;
        padding: 8px;
        color: orange;
        margin-bottom: 10px;
    }
}
</style>