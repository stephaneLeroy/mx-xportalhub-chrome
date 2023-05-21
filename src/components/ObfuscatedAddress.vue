<template>
    <span>{{obfuscated}}</span>
</template>
<script lang="ts" setup>
import {computed} from "vue";

const props = defineProps({
    value: {
        type: String,
        required: true
    }
});
const obfuscated = computed(() => {
        const keepNbChar = 6;
        if (!props.value || props.value.length < keepNbChar) {
            return undefined;
        }
        return props.value.slice(0, keepNbChar) +
            '...' +
            props.value.slice(-keepNbChar);

})
</script>