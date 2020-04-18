<template>
    <div>
        <div class="point-row"
            v-for="([p1, p2, rmse], index) of points"
            v-bind:key="index"
        >
            <div class="num"><b>{{index+1}}</b></div>
            <div class="point">
                <div class="dot" :style="{color: p1 ? imageryPointColor : '#eee' }">⬤</div>
                <div class="coordinates" v-if="p1">
                    <div class="dot" :style="{color: imageryPointColor}">⬤</div>
                    ( {{Math.round(p1.x)}}, {{Math.round(p1.y)}} )
                </div>
            </div> 
            <div class="point" >
                <div class="dot" :style="{color: p2 ? referencePointColor : '#eee' }">⬤</div>
                <div class="coordinates" v-if="p2">
                    <div class="dot" :style="{color: referencePointColor}">⬤</div>
                    ( {{Math.round(p2.x)}}, {{Math.round(p2.y)}} )
                    
                </div>
            </div>
            <!--<v-btn
                v-else-if="showPredictBtns"
                @click="predictPoint(index)" 
                text small style="margin: 0"
            >Predict</v-btn>-->
            <v-btn
                class="delete-point-pair"
                @click="deletePointPair(index)" 
                text small rounded style="margin: 0;"
            >
                ✕
            </v-btn>


            <div
                class="rmse"
                v-if="rmse"
                :style="{ color: `rgba(255,0,0,${magnitude(rmse)})` }"
                :title="`RMSE: ${rmse.toExponential(2)}`"
            >
                {{Math.round(magnitude(rmse)*10)}}
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['points', 'referencePointColor', 'imageryPointColor', 'showPredictBtns'],
    methods: {
        predictPoint(index) {
            this.$emit("predict-point", index)
        },
        deletePointPair(index) {
            this.$emit("delete-point-pair", index)
        },
        magnitude(num) {
            const clamp = (a,b,c) => Math.max(b,Math.min(c,a))
            const MAXOUT = 1.0
            const MINOUT = 0
            const MAXIN = 2
            const MININ = -3
            let magnitude = Math.log(num)
            //console.log("num: ", num)
            //console.log("magnitude: ", magnitude)
            magnitude = clamp(magnitude, MININ, MAXIN)
            //console.log("clamped: ", magnitude)
            magnitude += MINOUT - MININ
            magnitude *= (MAXOUT - MINOUT) / (MAXIN - MININ)
            //console.log("scaled: ", magnitude)
            //magnitude = Math.round(magnitude)
            //console.log("rounded: ", magnitude)
            return magnitude
        }
    },
}
</script>

<style lang="scss">
    .delete-point-pair:hover {
        color: red;
    }
    .delete-point-pair {
        padding-left: 10px!important;
        padding-right: 10px!important;
        min-width: 0px!important;
        position: relative;
        left: 5px;
    }
    .point-row {
        position: relative;
    }
    .point-row > div {
        display: inline-block;
    }
    $dot-shadow: rgba(0,0,0,0.1);
    $dot-outline: rgba(0,0,0,0.3);
    .dot {
        text-shadow: -1px 0 $dot-shadow, 0 1px $dot-shadow, 1px 0 $dot-shadow, 0 -1px $dot-shadow;
        display: inline-block;
        padding-left: 5px;
    }
    .point {
        cursor: default;
        position: relative;
    }
    $tooltip-bgcolor: rgb(220,220,220);
    .point .coordinates {
        position: absolute;
        left: 0px;
        height: 100%;
        z-index: 1;

        display: inline-block;
        background-color: $tooltip-bgcolor;        
        
        padding-right: 5px;
        border-radius: 5px;

        transition: all 0.5s ease-out;
        visibility: hidden;
        opacity: 0;

        white-space: nowrap;
    }
    .point:hover .coordinates {
        opacity: 1;
        visibility: visible;
        transition: all 0.2s ease-in;
    }
    .rmse {
        padding-left: 5px;
        cursor: default;
        position: absolute;
        right: -70px;
        top: 0px;
        width: 50px;
        text-align: left;
    }
</style>