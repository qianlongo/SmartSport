/**
 * Notes: 内部人员后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY www.code3721.com
 * Date: 2024-01-01 00:00:00 
 */

const BaseAdminService = require('./base_admin_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');
const util = require('../../../framework/utils/util.js');

const InternalUserModel = require('../../model/internal_user_model.js');

class AdminInternalUserService extends BaseAdminService {

	/** 取得内部人员分页列表 */
	async getInternalUserList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件 
		page,
		size,
		oldTotal = 0
	}) {

		orderBy = orderBy || {
			INTERNAL_USER_ADD_TIME: 'desc'
		};
		let fields = '*';

		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};

		if (util.isDefined(search) && search) {
			where.or = [{
					INTERNAL_USER_NAME: ['like', search]
				},
				{
					INTERNAL_USER_MOBILE: ['like', search]
				},
				{
					INTERNAL_USER_WORK: ['like', search]
				},
			];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					where.and.INTERNAL_USER_STATUS = Number(sortVal);
					break;
				case 'city':
					where.and.INTERNAL_USER_CITY = sortVal;
					break;
				case 'trade':
					where.and.INTERNAL_USER_TRADE = sortVal;
					break;
			}
		}

		let result = await InternalUserModel.getList(where, fields, orderBy, page, size, true, oldTotal, false);

		return result;
	}

	/** 导入内部人员数据 */
	async importInternalUserData({
		userList // 用户数据列表
	}) {
		if (!userList || !Array.isArray(userList) || userList.length === 0) {
			throw new Error('用户数据不能为空');
		}

		let successCount = 0;
		let failCount = 0;
		let failList = [];

		for (let i = 0; i < userList.length; i++) {
			let userData = userList[i];
			
			try {
				// 数据验证
				if (!userData.mobile) {
					failCount++;
					failList.push({
						row: i + 1,
						reason: '手机号不能为空',
						data: userData
					});
					continue;
				}

				// 检查手机号是否已存在
				let where = {
					and: {
						_pid: this.getProjectId(),
						INTERNAL_USER_MOBILE: userData.mobile
					}
				};
				let existUser = await InternalUserModel.getOne(where);
				if (existUser) {
					failCount++;
					failList.push({
						row: i + 1,
						reason: '手机号已存在',
						data: userData
					});
					continue;
				}

				// 插入数据
				let data = {
					INTERNAL_USER_NAME: userData.name,
					INTERNAL_USER_MOBILE: userData.mobile,
					INTERNAL_USER_CITY: userData.city || '',
					INTERNAL_USER_TRADE: userData.trade || '',
					INTERNAL_USER_WORK: userData.work || '',
					INTERNAL_USER_STATUS: InternalUserModel.STATUS.COMM,
					INTERNAL_USER_IMPORT_TIME: timeUtil.time(),
					INTERNAL_USER_IMPORT_ADMIN_ID: this.getAdminId(),
					INTERNAL_USER_IMPORT_ADMIN_NAME: this.getAdminName()
				};

				await InternalUserModel.insert(data);
				successCount++;

			} catch (err) {
				failCount++;
				failList.push({
					row: i + 1,
					reason: err.message || '导入失败',
					data: userData
				});
			}
		}

		return {
			successCount,
			failCount,
			failList
		};
	}

	/** 删除内部人员 */
	async delInternalUser({
		id
	}) {
		let where = {
			and: {
				_pid: this.getProjectId(),
				INTERNAL_USER_ID: id
			}
		};

		await InternalUserModel.del(where);
	}

	/** 修改内部人员状态 */
	async statusInternalUser({
		id,
		status
	}) {
		let where = {
			and: {
				_pid: this.getProjectId(),
				INTERNAL_USER_ID: id
			}
		};

		let data = {
			INTERNAL_USER_STATUS: status
		};

		await InternalUserModel.edit(where, data);
	}

	/** 生成导入模板Excel文件 */
	async generateImportTemplate() {
		const timeUtil = require('../../../framework/utils/time_util.js');
		const cloudBase = require('../../../framework/cloud/cloud_base.js');
		const config = require('../../../config/config.js');

		// 模板数据
		let templateData = [
			'姓名(非必填),手机号(必填),城市(选填),行业(选填),单位(选填)',
			'张三,13800138000,北京,IT,科技有限公司',
			'李四,13800138001,上海,金融,银行',
			'王五,13800138002,广州,教育,学校',
			',13800138003,深圳,,',
			',13800138004,,,'
		].join('\n');

		// 生成文件名
		let fileName = 'internal_user_template_' + timeUtil.time('Y-M-D-H-I-S') + '.csv';
		let csvPath = config.DATA_EXPORT_PATH + fileName;

		// 上传到云存储
		const cloud = cloudBase.getCloud();
		let upload = await cloud.uploadFile({
			cloudPath: csvPath,
			fileContent: Buffer.from(templateData, 'utf8'),
		});

		if (!upload || !upload.fileID) {
			throw new Error('模板文件上传失败');
		}

		return {
			url: upload.fileID,
			fileName: fileName
		};
	}









	/** 生成错误报告Excel文件 */
	async generateErrorReport(failList) {
		const xlsx = require('node-xlsx');
		const timeUtil = require('../../../framework/utils/time_util.js');
		const cloudBase = require('../../../framework/cloud/cloud_base.js');
		const config = require('../../../config/config.js');

		// 生成错误报告数据
		let reportData = [
			['行号', '姓名', '手机号', '城市', '行业', '单位', '错误原因']
		];

		// 添加失败记录
		failList.forEach(item => {
			reportData.push([
				item.row,
				item.data.name || '',
				item.data.mobile || '',
				item.data.city || '',
				item.data.trade || '',
				item.data.work || '',
				item.reason
			]);
		});

		// 生成Excel文件
		let buffer = await xlsx.build([{
			name: '导入错误报告',
			data: reportData,
			options: {
				'!cols': [
					{ wch: 8 },  // 行号列宽
					{ wch: 15 }, // 姓名列宽
					{ wch: 15 }, // 手机号列宽
					{ wch: 15 }, // 城市列宽
					{ wch: 15 }, // 行业列宽
					{ wch: 20 }, // 单位列宽
					{ wch: 30 }  // 错误原因列宽
				]
			}
		}]);

		// 生成文件名
		let fileName = 'import_error_report_' + timeUtil.time('Y-M-D-H-I-S') + '.xlsx';
		let xlsPath = config.DATA_EXPORT_PATH + fileName;

		// 上传到云存储
		const cloud = cloudBase.getCloud();
		let upload = await cloud.uploadFile({
			cloudPath: xlsPath,
			fileContent: buffer,
		});

		if (!upload || !upload.fileID) {
			throw new Error('错误报告文件上传失败');
		}

		return upload.fileID;
	}

}

module.exports = AdminInternalUserService; 