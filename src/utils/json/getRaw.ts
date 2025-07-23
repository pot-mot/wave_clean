import {toRaw} from "vue";
import {cloneDeep} from "lodash-es";

export const getRaw = <T> (value: T): T => {
    return cloneDeep(toRaw(value))
}
