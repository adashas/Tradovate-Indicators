const predef = require("./tools/predef");
const { min, max, du, px, op } = require('./tools/graphics')
const SMA = require("./tools/SMA");
const BidAskTool = require('./BidAskTool')

function Aggregator() {
    function agg(d) {
        return agg.push(d)
    }
    
    agg.push = d => {
        const item = agg.state.fullSet[d.value().toString()]
        
        if(item) {
            item.bids += d.bidVolume()
            item.asks += d.offerVolume()
            item.vol  += d.volume()
        } else {
            agg.state.fullSet[d.value().toString()] = {
                bids: d.bidVolume(),
                asks: d.offerVolume(),
                vol:  d.volume(),
                delta() { return this.asks - this.bids },
                percentBids() { return (this.bids/this.vol) * 100 },
                percentAsks() { return (this.asks/this.vol) * 100 }
            }
        }
        agg.state.all.push(d)
        return agg.state.fullSet
    }
    
    agg.reset = () => {
        agg.state = {
            fullSet: {},
            all: []
        }
    }
    
    agg.reset()
    
    return agg
}

const mapColorProps = props => ({
    
})


class PriceAxisDelta {
    init() {
        this.agg = Aggregator()
        this.bat = BidAskTool(this.marketOpenHours)
    }

    map(d) {
        const data = this.agg(d)
        const {
            avgAccumVol
        } = this.bat(d)
        
        const container = {
            tag: 'Container',
            key: 'vol_container',
            origin: {
                cs: 'grid',
                h: 'right',
                v: 'top'
            },
            conditions: {
                scaleRangeX: {
                    min: 64
                }
            },
            children: [],
        }
        
        if(d.isLast()) {
            Object.keys(data).forEach((k) => {
                const item = data[k]
                const delta = item.delta()
                
                container.children = container.children.concat([{
                    tag: 'Shapes',
                    key: 'volumeBars_' + k,
                    origin: {
                        cs: 'grid',
                        h: 'right',
                        v: 'top'
                    },
                    primitives: [
                        {
                            tag: 'Rectangle',
                            position: {
                                x: px(0),
                                y: du(parseFloat(k, 10))
                            },
                            size: {
                                height: min(du(.2), px(6)),
                                width: du(-1 * Math.abs(delta/avgAccumVol))
                            }
                        }
                    ],
                    fillStyle: {
                        color: 
                            delta > 0 ? '#4b4'
                        :   delta < 0 ? '#b44'
                        :               '#999'
                    }
                },
                {
                    tag: 'Text',
                    key: 'text_' + k,
                    origin: {
                        cs: 'grid',
                        h: 'right',
                        v: 'top'
                    },
                    point: {
                        x: op(px(-4), '+', du(-1 * Math.abs(delta/avgAccumVol))),
                        y: du(parseFloat(k, 10)),
                    },
                    text: `${delta}`,
                    style: {
                        fontSize: 10,
                        fill: '#999'
                    },
                    textAlignment: 'leftBelow'
                }])
            })
        }
        

        return {
            graphics: {
                items: [
                    container
                ]
            }
        }
    }
}

module.exports = {
    inputType: 'bars',
    name: "PriceAxisDelta",
    description: "Price Axis Volume Delta",
    calculator: PriceAxisDelta,
    params: {
        marketOpenHours: predef.paramSpecs.number(7,1,1),
        marketOpenMinutes: predef.paramSpecs.number(30,1,1),
        
        // lowBid: predef.paramSpecs.color('#999'),      //0-20%
        // midLowBid: predef.paramSpecs.color('#696'),   //20-40%
        // midBid: predef.paramSpecs.color('#4b4'),      //40-60%
        // midHighBid: predef.paramSpecs.color('#2d2'),  //60-80%
        // highBid: predef.paramSpecs.color('#0f0'),     //80-100%
        
        // lowAsk: predef.paramSpecs.color(),
        // midLowAsk: predef.paramSpecs.color(),
        // midAsk: predef.paramSpecs.color(),
        // midHighAsk: predef.paramSpecs.color(),
        // highAsk: predef.paramSpecs.color(),
        
    },
    tags: [predef.tags.Volumes],
    schemeStyles: predef.styles.solidLine("#000")
};
