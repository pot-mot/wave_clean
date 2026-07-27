import {createStore} from '@/utils/store/createStore.ts';
import {computed, nextTick, ref, watch} from 'vue';

const show = ref(false);
const focusSearchInput = ref<(() => void) | undefined>(undefined);

const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        closeSearch();
    }
};

const openSearch = async () => {
    show.value = true;
    await nextTick();
    focusSearchInput.value?.();
};

const closeSearch = () => {
    show.value = false;
};

watch(show, (value) => {
    if (value) {
        document.documentElement.addEventListener('keydown', handleEscape, {capture: true});
    } else {
        document.documentElement.removeEventListener('keydown', handleEscape, {capture: true});
    }
});

const registerFocusFn = (fn: () => void) => {
    focusSearchInput.value = fn;
};

export const useSearchStore = createStore(() => {
    return {
        searcherShow: computed<boolean>({
            get: () => show.value,
            set: (val) => {
                show.value = val;
            },
        }),
        openSearch,
        closeSearch,
        registerFocusFn,
    };
});
