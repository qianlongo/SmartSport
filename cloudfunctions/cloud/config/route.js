/**
 * Notes: 路由配置文件
 * User: CC
 * Date: 2020-10-14 07:00:00
 */

module.exports = { 
	'home/setup_all': 'home_controller@getSetupAll', //获取全局配置(所有)

	'passport/phone': 'passport_controller@getPhone',
	'passport/my_detail': 'passport_controller@getMyDetail',
	'passport/edit_base': 'passport_controller@editBase',

	'news/list': 'news_controller@getNewsList',
	'news/home_list': 'news_controller@getHomeNewsList',
	'news/view': 'news_controller@viewNews', 

	'meet/list': 'meet_controller@getMeetList',
	'meet/list_by_day': 'meet_controller@getMeetListByDay',
	'meet/list_has_day': 'meet_controller@getHasDaysFromDay',
	'meet/view': 'meet_controller@viewMeet',
	'meet/detail_for_join': 'meet_controller@detailForJoin',
	'meet/before_join': 'meet_controller@beforeJoin',
	'meet/join': 'meet_controller@join',

	'my/my_join_list': 'meet_controller@getMyJoinList',
	'my/my_join_cancel': 'meet_controller@cancelMyJoin',
	'my/my_join_detail': 'meet_controller@getMyJoinDetail',
	'my/my_join_someday': 'meet_controller@getMyJoinSomeday',
	'my/my_join_checkin': 'meet_controller@userSelfCheckin', 

	'test/test': 'test/test_controller@test',
	'test/meet_test_join': 'test/test_meet_controller@testJoin',

	//***########### ADMIN ################## */  
	'admin/login': 'admin/admin_home_controller@adminLogin',
	'admin/home': 'admin/admin_home_controller@adminHome',
	'admin/clear_cache': 'admin/admin_home_controller@clearCache#noDemo', // 清除缓存|已支持

	'admin/setup_about': 'admin/admin_setup_controller@setupAbout#noDemo', // 关于我们 不需要
	'admin/setup_contact': 'admin/admin_setup_controller@setupContact#noDemo', // 联系方式 不需要
	'admin/setup_qr': 'admin/admin_setup_controller@genMiniQr', 

	'admin/news_list': 'admin/admin_news_controller@getNewsList', // 文章列表|已支持
	'admin/news_insert': 'admin/admin_news_controller@insertNews#noDemo', // 添加文章|已支持
	'admin/news_detail': 'admin/admin_news_controller@getNewsDetail', // 文章详情|已支持
	'admin/news_edit': 'admin/admin_news_controller@editNews#noDemo', // 修改文章|已支持
	'admin/news_update_pic': 'admin/admin_news_controller@updateNewsPic#noDemo', // 上传封面图
	'admin/news_update_content': 'admin/admin_news_controller@updateNewsContent#noDemo', // 更新文章内容|已支持
	'admin/news_del': 'admin/admin_news_controller@delNews#noDemo',  // 删除文章|已支持
	'admin/news_sort': 'admin/admin_news_controller@sortNews#noDemo', // 上首页| 已支持
	'admin/news_status': 'admin/admin_news_controller@statusNews#noDemo', // 修改文章状态| 启用/停用 已支持

	'admin/meet_list': 'admin/admin_meet_controller@getMeetList',// 活动列表|已支持
	'admin/meet_join_list': 'admin/admin_meet_controller@getJoinList', // 预约列表|已支持
	'admin/join_status': 'admin/admin_meet_controller@statusJoin#noDemo', // 预约状态|已支持
	'admin/join_del': 'admin/admin_meet_controller@delJoin#noDemo', // 删除预约|已支持
	'admin/meet_insert': 'admin/admin_meet_controller@insertMeet#noDemo', // 插入活动 |已支持
	'admin/meet_copy': 'admin/admin_meet_controller@copyMeet#noDemo', // 复制活动 |已支持
	'admin/meet_detail': 'admin/admin_meet_controller@getMeetDetail', // 活动详情|已支持
	'admin/meet_edit': 'admin/admin_meet_controller@editMeet#noDemo', // 修改活动|已支持
	'admin/meet_del': 'admin/admin_meet_controller@delMeet#noDemo', // 删除活动|已支持
	'admin/meet_update_content': 'admin/admin_meet_controller@updateMeetContent#noDemo', // 更新活动内容|已支持
	'admin/meet_update_style': 'admin/admin_meet_controller@updateMeetStyleSet#noDemo', // 更新活动封面图
	'admin/meet_sort': 'admin/admin_meet_controller@sortMeet#noDemo', // 置顶排序设定 |已支持
	'admin/meet_status': 'admin/admin_meet_controller@statusMeet#noDemo', // 修改活动状态| 启用/停用 已支持
	'admin/meet_cancel_time_join': 'admin/admin_meet_controller@cancelJoinByTimeMark#noDemo',
	'admin/join_scan': 'admin/admin_meet_controller@scanJoin#noDemo', // 扫码核销
	'admin/join_checkin': 'admin/admin_meet_controller@checkinJoin#noDemo', // 签到核销 |已支持
	'admin/self_checkin_qr': 'admin/admin_meet_controller@genSelfCheckinQr',
	'admin/meet_day_list': 'admin/admin_meet_controller@getDayList',

	'admin/join_data_get': 'admin/admin_export_controller@joinDataGet',
	'admin/join_data_export': 'admin/admin_export_controller@joinDataExport',
	'admin/join_data_del': 'admin/admin_export_controller@joinDataDel#noDemo',

	'admin/temp_insert': 'admin/admin_meet_controller@insertTemp#noDemo', // 模板插入
	'admin/temp_list': 'admin/admin_meet_controller@getTempList',
	'admin/temp_del': 'admin/admin_meet_controller@delTemp#noDemo',
	'admin/temp_edit': 'admin/admin_meet_controller@editTemp#noDemo',  // 模板编辑

	'admin/log_list': 'admin/admin_mgr_controller@getLogList',

	'admin/user_list': 'admin/admin_user_controller@getUserList',
	'admin/user_detail': 'admin/admin_user_controller@getUserDetail',
	'admin/user_del': 'admin/admin_user_controller@delUser#noDemo',  

	'admin/user_data_get': 'admin/admin_export_controller@userDataGet',
	'admin/user_data_export': 'admin/admin_export_controller@userDataExport',
	'admin/user_data_del': 'admin/admin_export_controller@userDataDel#noDemo',

	'admin/internal_user_list': 'admin/admin_internal_user_controller@getInternalUserList',
	'admin/internal_user_import': 'admin/admin_internal_user_controller@importInternalUserData#noDemo',
	'admin/internal_user_add': 'admin/admin_internal_user_controller@addInternalUser#noDemo',
	'admin/internal_user_edit': 'admin/admin_internal_user_controller@editInternalUser#noDemo',
	'admin/internal_user_del': 'admin/admin_internal_user_controller@delInternalUser#noDemo',
	'admin/internal_user_status': 'admin/admin_internal_user_controller@statusInternalUser#noDemo',
	'admin/internal_user_template': 'admin/admin_internal_user_controller@generateImportTemplate',

}