const timeHelper = require('../../../../helper/time_helper.js');
const pageHelper = require('../../../../helper/page_helper.js');
const calendarLib = require('../calendar_lib.js');

/*#### 父组件日历颜色定义*/
/* 整体颜色 */
//--calendarPageColor: #F0F4FF;
/* 加重颜色*/
//--calendarMainColor: #388AFF;
/* 加重的亮颜色 用于选中日期的数据小圆点 */
//--calendarLightColor: #A2C7FF;


Component({
	options: {
		addGlobalClass: true
	},
	properties: {
		isLunar: { //是否开启农历
			type: Boolean,
			value: true
		},
		mode: { // 模式 one/multi
			type: String,
			value: 'one'
		},

		year: { // 正在操作的年
			type: Number,
			value: 0
		},

		month: { // 正在操作的月
			type: Number,
			value: 0
		},
		fold: { //日历折叠
			type: Boolean,
			value: false
		},
		selectTimeout: { //过期时间选择(mode=multi)
			type: Boolean,
			value: true
		},
		selectTimeoutHint: { //过期时间选择提示(mode=multi)
			type: String,
			value: '不能选择过去的日期'
		},
		hasDays: { // 有数据的日期
			type: Array,
			value: [],
			observer: function (newVal, oldVal) {
				console.log('hasDays changed:', newVal);
				if (newVal.length != oldVal.length) {
					// TODO 引起加载的时候二次调用 
					//this._init();
				}
			}
		},
		hasDaysData: { // 完整的可预约日期数据
			type: Array,
			value: [],
			observer: function (newVal, oldVal) {
				console.log('hasDaysData changed:', newVal);
			}
		},
		oneDoDay: { // 正在操作的天  string
			type: String,
			value: null
		},
		multiDoDay: { // 多选模式>正在操作的天 arrary[]
			type: Array,
			value: null,
		},
		multiOnlyOne: { //多选模式>只能选一个
			type: Boolean,
			value: false
		},
		limitDays: { // 预约限制天数，0表示不限制
			type: Number,
			value: 0
		}
	},

	data: {
		weekNo: 0, // 正在操作的那天位于第几周 
		fullToday: 0, //今天 
		maxBookDay: '', // 最大可预约日期
	},

	lifetimes: {
		attached() {
			this._init();
		}
	},

	methods: {
		_init: function () {
			calendarLib.getNowTime(this);
			calendarLib.createDay(this);
			
			// 设置最大可预约日期（包含今天，所以是limitDays-1天）
			if (this.data.limitDays > 0) {
				let maxBookDay = timeHelper.getDateAfterDays(this.data.limitDays - 1, 'Y-M-D');
				this.setData({
					maxBookDay
				});
			}
		},


		bindFoldTap: function (e) { // 日历折叠
			calendarLib.bindFoldTap(this);
		},


		bindNextTap(e) { // 下月
			calendarLib.bindNextTap(this);
		},

		bindLastTap(e) { // 上月
			calendarLib.bindLastTap(this);
		},

		bindDayOneTap(e) { // 单个天点击
			let day = e.currentTarget.dataset.fullday;
			let now = timeHelper.time('Y-M-D');
			
			if (day < now)
				return pageHelper.showNoneToast('已过期', 1000);
			
			// 检查是否有预约且超过7天限制
			if (this.data.hasDaysData && this.data.hasDaysData.length > 0) {
				for (let k in this.data.hasDaysData) {
					if (this.data.hasDaysData[k].day === day && !this.data.hasDaysData[k].canBook) {
						return pageHelper.showNoneToast('该日期不可预约，请选择最近7个可预约日期', 1500);
					}
				}
			}

			calendarLib.bindDayOneTap(e, this);
		},

		bindDayMultiTap(e) { // 多选天点击
			let day = e.currentTarget.dataset.fullday;
			let now = timeHelper.time('Y-M-D');
			
			// 过期时间判断
			if (!this.data.selectTimeout) {
				if (day < now)
					return pageHelper.showNoneToast(this.data.selectTimeoutHint);
			}
			
			// 检查是否有预约且超过7天限制
			if (this.data.hasDaysData && this.data.hasDaysData.length > 0) {
				for (let k in this.data.hasDaysData) {
					if (this.data.hasDaysData[k].day === day && !this.data.hasDaysData[k].canBook) {
						return pageHelper.showNoneToast('该日期不可预约，请选择最近7个可预约日期', 1500);
					}
				}
			}

			calendarLib.bindDayMultiTap(e, this);
		},

		bindToNowTap: function (e) { // 回本月
			calendarLib.bindToNowTap(this);
		},

		// ListTouch触摸开始
		listTouchStart(e) {
			pageHelper.listTouchStart(e, this);
		},

		// ListTouch计算方向
		listTouchMove(e) {
			pageHelper.listTouchMove(e, this);
		},

		/** ListTouch计算滚动 */
		listTouchEnd: function (e) {
			calendarLib.listTouchEnd(this);
		}
	}
})