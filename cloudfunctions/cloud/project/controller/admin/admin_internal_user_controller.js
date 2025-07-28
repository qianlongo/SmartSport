/**
 * Notes: 内部人员后台管理-控制器
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux@qq.com
 * Date: 2024-01-01 00:00:00 
 */

const BaseAdminController = require('./base_admin_controller.js');
const AdminInternalUserService = require('../../service/admin/admin_internal_user_service.js');

class AdminInternalUserController extends BaseAdminController {

	/** 取得内部人员分页列表 */
	async getInternalUserList() {
		await this.isAdmin();

		// 数据校验
		let rules = {
			search: 'string|min:1|max:50|name=搜索条件',
			sortType: 'string|name=搜索类型',
			sortVal: 'string|name=搜索类型值',
			orderBy: 'string|name=排序',
			whereEx: 'object|name=附加查询条件',
			page: 'must|int|default=1',
			size: 'int',
			oldTotal: 'int',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new AdminInternalUserService();
		let result = await service.getInternalUserList(input);

		return result;
	}

	/** 导入内部人员数据 */
	async importInternalUserData() {
		await this.isAdmin();

		// 数据校验
		let rules = {
			userList: 'array|must|name=用户数据列表',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new AdminInternalUserService();
		let result = await service.importInternalUserData(input);

		return result;
	}

	/** 删除内部人员 */
	async delInternalUser() {
		await this.isAdmin();

		// 数据校验
		let rules = {
			id: 'id|must|name=内部人员ID',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new AdminInternalUserService();
		await service.delInternalUser(input);
	}

	/** 修改内部人员状态 */
	async statusInternalUser() {
		await this.isAdmin();

		// 数据校验
		let rules = {
			id: 'id|must|name=内部人员ID',
			status: 'int|must|in=0,1|name=状态',
		};

		// 取得数据
		let input = this.validateData(rules);

		let service = new AdminInternalUserService();
		await service.statusInternalUser(input);
	}

	/** 生成导入模板 */
	async generateImportTemplate() {
		await this.isAdmin();

		// 数据校验
		let rules = {};

		// 取得数据
		let input = this.validateData(rules);

		let service = new AdminInternalUserService();
		let result = await service.generateImportTemplate();

		return result;
	}





}

module.exports = AdminInternalUserController; 