/**
 * Notes: 内部人员实体
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux@qq.com
 * Date: 2024-01-01 00:00:00 
 */

const BaseModel = require('./base_model.js');
const dbUtil = require('../../framework/database/db_util.js');

class InternalUserModel extends BaseModel {
	
	/**
	 * 插入数据
	 * @param {*} data 
	 */
	static async insert(data, mustPID = true) {
		// 检查集合是否存在，不存在则创建
		if (!(await dbUtil.isExistCollection(this.CL))) {
			await dbUtil.createCollection(this.CL);
		}
		
		return await super.insert(data, mustPID);
	}
}

// 集合名
InternalUserModel.CL = "ax_internal_user";

InternalUserModel.DB_STRUCTURE = {
	_pid: 'string|true',
	INTERNAL_USER_ID: 'string|true',

	INTERNAL_USER_NAME: 'string|false|comment=姓名',
	INTERNAL_USER_MOBILE: 'string|true|comment=手机号',
	INTERNAL_USER_CITY: 'string|false|comment=城市',
	INTERNAL_USER_TRADE: 'string|false|comment=行业',
	INTERNAL_USER_WORK: 'string|false|comment=单位',

	INTERNAL_USER_STATUS: 'int|true|default=1|comment=状态 0=禁用,1=正常',

	INTERNAL_USER_IMPORT_TIME: 'int|true|comment=导入时间',
	INTERNAL_USER_IMPORT_ADMIN_ID: 'string|false|comment=导入管理员ID',
	INTERNAL_USER_IMPORT_ADMIN_NAME: 'string|false|comment=导入管理员姓名',

	INTERNAL_USER_ADD_TIME: 'int|true',
	INTERNAL_USER_ADD_IP: 'string|false',

	INTERNAL_USER_EDIT_TIME: 'int|true',
	INTERNAL_USER_EDIT_IP: 'string|false',
}

// 字段前缀
InternalUserModel.FIELD_PREFIX = "INTERNAL_USER_";

/**
 * 状态 0=禁用,1=正常 
 */
InternalUserModel.STATUS = {
	DISABLE: 0,
	COMM: 1
};

InternalUserModel.STATUS_DESC = {
	DISABLE: '禁用',
	COMM: '正常'
};

module.exports = InternalUserModel; 