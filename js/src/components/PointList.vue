<template>
    <div>
        <table width=100%>
            <tr>
                <td></td>
                <td :style="{color: imageryPointColor}">Image</td>
                <td :style="{color: referencePointColor}">Reference</td>
                <td>RMSE</td>
            </tr>
            <tr v-for="([p1, p2, rmse], index) of points" v-bind:key="index">
                <td style="padding-right: 10px">{{index+1}}</td>
                <td class="point-width" nowrap>
                    <span v-if="p1">
                        ({{Math.round(p1.x)}}, {{Math.round(p1.y)}})
                    </span>
                </td>
                <td class="point-width" nowrap>
                    <span v-if="p2">
                        ({{Math.round(p2.x)}}, {{Math.round(p2.y)}})
                    </span>
                    <v-btn 
                        v-else-if="showPredictBtns"
                        @click="extrapolate(index)" 
                        text small style="margin: 0"
                    >Predict</v-btn>
                </td>
                <td class="rmse-width" nowrap>
                    <span v-if="rmse" style="{ color: 'red'}">
                        {{rmse.toExponential(2)}}
                    </span>
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
export default {
    props: ['points', 'referencePointColor', 'imageryPointColor', 'showPredictBtns'],
    methods: {
        extrapolate(index) {
            this.$emit("predict-point", index)
        }
    },
}
</script>

<style>
    .point-width {
        min-width: 7em;
    }
    .rmse-width {
        min-width: 5em;
    }
</style>