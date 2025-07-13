/**
 * Notes: 预约后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux@qq.com
 * Date: 2021-12-08 07:48:00 
 */

const BaseAdminService = require('./base_admin_service.js');
const TempModel = require('../../model/temp_model.js');

class AdminTempService extends BaseAdminService {

	/**添加模板 */
	async insertTemp({
		name,
		times,
	}) {
		try {
			await TempModel.insert({
				TEMP_NAME: name,
				TEMP_TIMES: times,
			});
			return {
				result: "ok",
			}
		} catch (error) {
			this.AppError("插入模板失败：" + error.message);
			return {
				result: "error",
				msg: error.message,
			}
		}
	}

	/**更新数据 */
	async editTemp({
		id,
		limit,
		isLimit
	}) {
		try {
			// 先获取模板数据
			let where = {
				_id: id,
			};
			let temp = await TempModel.getOne(where, 'TEMP_TIMES');
			if (!temp) {
				this.AppError("模板不存在");
				return {
					result: "error",
					msg: "模板不存在",
				}
			}

			// 更新TEMP_TIMES数组中每个时间段的isLimit和limit
			let times = temp.TEMP_TIMES;
			if (Array.isArray(times)) {
				for (let i = 0; i < times.length; i++) {
					times[i].isLimit = isLimit;
					times[i].limit = limit;
				}
			}

			// 更新数据库
			let data = {
				TEMP_TIMES: times,
			};
			await TempModel.edit(where, data);

			return {
				result: "ok",
			}
		} catch (error) {
			this.AppError("更新模板失败：" + error.message);
			return {
				result: "error",
				msg: error.message,
			}
		}
	}


	/**删除数据 */
	async delTemp(id) {
		this.AppError('此功能暂不开放，如有需要请加作者微信：cclinux0730');
	}


	/**分页列表 */
	async getTempList() {
		let orderBy = {
			'TEMP_ADD_TIME': 'desc'
		};
		let fields = 'TEMP_NAME,TEMP_TIMES';

		let where = {};
		return await TempModel.getAll(where, fields, orderBy);
	}
}

module.exports = AdminTempService;