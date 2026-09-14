package model

import (
	"fmt"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"gorm.io/gorm"
)

// 返利结算状态。
const (
	// AffiliateRebateStatusPending 返利已产生，但仍在冷却期内，不可转移。
	AffiliateRebateStatusPending = "pending"
	// AffiliateRebateStatusConfirmed 冷却期结束，已释放到可转移的 aff_quota。
	AffiliateRebateStatusConfirmed = "confirmed"
)

// 返利计次来源。
const (
	AffiliateSourceTopUp      = "topup"
	AffiliateSourceRedemption = "redemption"
)

// releaseAffiliateBatchSize 每次释放任务处理的返利条数上限，避免单次任务过长。
const releaseAffiliateBatchSize = 500

// AffiliateRebate 是每一笔返利的明细，用于对账、冷却释放与幂等。
//
// RefId 上的唯一索引是幂等的硬保证：同一次充值/兑换最多只产生一条返利，
// 重复回调不会重复发放。
type AffiliateRebate struct {
	Id          int    `json:"id"`
	InviterId   int    `json:"inviter_id" gorm:"index"`
	InviteeId   int    `json:"invitee_id" gorm:"index"`
	Source      string `json:"source" gorm:"type:varchar(32)"`
	RefId       string `json:"ref_id" gorm:"type:varchar(160);uniqueIndex"`
	Ordinal     int    `json:"ordinal"`     // 被邀请人这是第几次充值
	RateBp      int    `json:"rate_bp"`     // 本次适用的返利比例（万分比）
	BaseQuota   int    `json:"base_quota"`  // 计费基数（本次到账额度）
	RebateQuota int    `json:"rebate_quota"`
	Status      string `json:"status" gorm:"type:varchar(16);index"`
	CreatedTime int64  `json:"created_time" gorm:"bigint;index"`
	ConfirmTime int64  `json:"confirm_time" gorm:"bigint"`
}

// TopupCountUpdate 返回 creditTopUpQuota 的 updates 参数，在给用户加额度的
// 同一条 UPDATE 里顺带递增充值计次。
//
// 计次口径与 bblabu 对齐：包含在线充值、管理员补单与兑换码。余额购买订阅
// 不经过这里，因此不会被重复计次。
func TopupCountUpdate(extra map[string]interface{}) map[string]interface{} {
	updates := make(map[string]interface{}, len(extra)+1)
	for key, value := range extra {
		updates[key] = value
	}
	updates["topup_count"] = gorm.Expr("topup_count + 1")
	return updates
}

// AffiliateRefId 构造返利幂等键。tradeNo 对充值渠道全局唯一，兑换码用主键。
func AffiliateRefId(source string, id any) string {
	return fmt.Sprintf("%s:%v", source, id)
}

// SettleAffiliateRebate 结算一次充值/兑换产生的邀请返利。
//
// 调用约定（AGENTS.md 计费安全不变量）：
//   - 必须在充值事务**提交之后**调用。返利是附赠品，返利侧的任何失败都不允许
//     让已经付过钱的充值失败或回滚，因此调用方只记录错误、不向上返回。
//   - 幂等由 RefId 前置存在性检查 + 唯一索引双重保证，重复回调不会重复发放。
func SettleAffiliateRebate(inviteeId int, source string, refId string, baseQuota int) error {
	setting := operation_setting.GetAffiliateSetting()
	if !setting.Enabled || inviteeId <= 0 || refId == "" || baseQuota <= 0 {
		return nil
	}

	return DB.Transaction(func(tx *gorm.DB) error {
		var existing int64
		if err := tx.Model(&AffiliateRebate{}).Where("ref_id = ?", refId).Count(&existing).Error; err != nil {
			return err
		}
		if existing > 0 {
			return nil
		}

		// topup_count 已在充值事务内自增并已提交，因此这里读到的就是本次计次。
		var invitee User
		if err := tx.Select("id", "inviter_id", "topup_count").Where("id = ?", inviteeId).First(&invitee).Error; err != nil {
			return err
		}
		// inviter_id 为 0 表示不是被邀请来的用户；自邀不产生返利。
		if invitee.InviterId <= 0 || invitee.InviterId == inviteeId {
			return nil
		}

		rebateQuota := setting.CalcRebateQuota(baseQuota, invitee.TopupCount)
		if rebateQuota <= 0 {
			return nil
		}

		// 单个被邀请人的累计返利上限：超出部分直接不发，而不是报错。
		if setting.MaxRebatePerInvitee > 0 {
			var earned int64
			if err := tx.Model(&AffiliateRebate{}).
				Where("inviter_id = ? AND invitee_id = ?", invitee.InviterId, inviteeId).
				Select("COALESCE(SUM(rebate_quota), 0)").
				Scan(&earned).Error; err != nil {
				return err
			}
			remaining := int64(setting.MaxRebatePerInvitee) - earned
			if remaining <= 0 {
				return nil
			}
			if int64(rebateQuota) > remaining {
				rebateQuota = int(remaining)
			}
		}

		record := &AffiliateRebate{
			InviterId:   invitee.InviterId,
			InviteeId:   inviteeId,
			Source:      source,
			RefId:       refId,
			Ordinal:     invitee.TopupCount,
			RateBp:      setting.TierRateBp(invitee.TopupCount),
			BaseQuota:   baseQuota,
			RebateQuota: rebateQuota,
			Status:      AffiliateRebateStatusPending,
			CreatedTime: common.GetTimestamp(),
		}
		if err := tx.Create(record).Error; err != nil {
			return err
		}

		// 只进「待确认」池与历史累计，不直接进可转移池：冷却期由释放任务负责。
		return tx.Model(&User{}).Where("id = ?", invitee.InviterId).Updates(map[string]interface{}{
			"aff_pending": gorm.Expr("aff_pending + ?", rebateQuota),
			"aff_history": gorm.Expr("aff_history + ?", rebateQuota),
		}).Error
	})
}

// ReleaseDueAffiliateRebates 把冷却期满的返利从待确认池释放到可转移池。
//
// 每条记录都先做 pending -> confirmed 的 CAS，成功者才加 aff_quota，因此即使
// 多实例并发执行也不会重复释放。
func ReleaseDueAffiliateRebates() (released int, err error) {
	setting := operation_setting.GetAffiliateSetting()
	cooldownDays := setting.CooldownDays
	if cooldownDays < 0 {
		cooldownDays = 0
	}
	deadline := common.GetTimestamp() - int64(cooldownDays)*86400

	var pending []*AffiliateRebate
	if err = DB.Where("status = ? AND created_time <= ?", AffiliateRebateStatusPending, deadline).
		Order("id asc").
		Limit(releaseAffiliateBatchSize).
		Find(&pending).Error; err != nil {
		return 0, err
	}

	for _, record := range pending {
		ok, confirmErr := confirmAffiliateRebate(record)
		if confirmErr != nil {
			common.SysError(fmt.Sprintf("释放邀请返利失败 rebate_id=%d: %v", record.Id, confirmErr))
			continue
		}
		if ok {
			released++
		}
	}
	return released, nil
}

// confirmAffiliateRebate 释放单条返利。返回 false 表示该条已被其它实例释放。
func confirmAffiliateRebate(record *AffiliateRebate) (bool, error) {
	confirmed := false
	err := DB.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&AffiliateRebate{}).
			Where("id = ? AND status = ?", record.Id, AffiliateRebateStatusPending).
			Updates(map[string]interface{}{
				"status":       AffiliateRebateStatusConfirmed,
				"confirm_time": common.GetTimestamp(),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return nil
		}

		// 带下界保护的更新：待确认余额不足说明账目不一致，宁可报错留待人工核对，
		// 也不要写出负余额。
		update := tx.Model(&User{}).
			Where("id = ? AND aff_pending >= ?", record.InviterId, record.RebateQuota).
			Updates(map[string]interface{}{
				"aff_pending": gorm.Expr("aff_pending - ?", record.RebateQuota),
				"aff_quota":   gorm.Expr("aff_quota + ?", record.RebateQuota),
			})
		if update.Error != nil {
			return update.Error
		}
		if update.RowsAffected == 0 {
			return fmt.Errorf("邀请人 %d 的待确认返利不足 %d，账目异常", record.InviterId, record.RebateQuota)
		}
		confirmed = true
		return nil
	})
	return confirmed, err
}

// ListUserAffiliateRebates 返回某人作为邀请人收到的返利明细。
func ListUserAffiliateRebates(inviterId int, pageInfo *common.PageInfo) (records []*AffiliateRebate, total int64, err error) {
	if inviterId <= 0 {
		return nil, 0, nil
	}
	query := DB.Model(&AffiliateRebate{}).Where("inviter_id = ?", inviterId)
	if err = query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err = query.Order("id desc").
		Limit(pageInfo.GetPageSize()).
		Offset(pageInfo.GetStartIdx()).
		Find(&records).Error
	return records, total, err
}

// settleAffiliateRebateAfterTopUp 在充值事务提交后结算邀请返利。
//
// 这里刻意吞掉所有错误：返利是附赠品，任何失败都只记日志，绝不能影响一笔已经
// 成功的充值（用户已经付过钱了）。少发返利是可接受的，多发不可接受。
func settleAffiliateRebateAfterTopUp(userId int, provider string, tradeNo string, baseQuota int) {
	if userId <= 0 || tradeNo == "" || baseQuota <= 0 {
		return
	}
	if err := SettleAffiliateRebate(
		userId,
		AffiliateSourceTopUp,
		AffiliateRefId(AffiliateSourceTopUp, tradeNo),
		baseQuota,
	); err != nil {
		common.SysError(fmt.Sprintf("邀请返利结算失败 provider=%s trade_no=%s user_id=%d: %v",
			provider, tradeNo, userId, err))
	}
}

// settleAffiliateRebateAfterRedemption 在兑换码核销后结算邀请返利。
//
// 兑换码计入返利计次，与 bblabu 的口径一致。前提是兑换码只由管理员创建
// （controller/redemption.go 的 AddRedemption 位于 AdminAuth 之后，是全仓唯一
// 的创建入口），因此每一张码都对应一次真实的付费行为。若将来出现任何非管理员
// 的发码渠道，必须在这里排除，否则免费码会变成套利工具。
func settleAffiliateRebateAfterRedemption(userId int, redemptionId int, baseQuota int) {
	if userId <= 0 || redemptionId <= 0 || baseQuota <= 0 {
		return
	}
	if err := SettleAffiliateRebate(
		userId,
		AffiliateSourceRedemption,
		AffiliateRefId(AffiliateSourceRedemption, redemptionId),
		baseQuota,
	); err != nil {
		common.SysError(fmt.Sprintf("邀请返利结算失败 source=%s redemption_id=%d user_id=%d: %v",
			AffiliateSourceRedemption, redemptionId, userId, err))
	}
}

// affiliateInviteeListLimit 邀请名单一次最多返回多少行，避免大邀请量时拖慢接口。
const affiliateInviteeListLimit = 50

// AffiliateInvitee 是邀请名单里的一行：被邀请人的基本情况 + 其为邀请人带来的返利。
type AffiliateInvitee struct {
	UserId       int    `json:"user_id"`
	Username     string `json:"username"`
	CreatedAt    int64  `json:"created_at"`
	TopupCount   int    `json:"topup_count"`
	UsedQuota    int    `json:"used_quota"`
	RequestCount int    `json:"request_count"`
	RebateQuota  int    `json:"rebate_quota"`
}

// AffiliateFunnel 是邀请转化的漏斗统计。
//
// 活跃口径定义为「被邀请人发起过至少一次请求」，充值口径为「至少成功充值/兑换一次」。
type AffiliateFunnel struct {
	Registered int64 `json:"registered"`
	Active     int64 `json:"active"`
	ToppedUp   int64 `json:"topped_up"`
}

// AffiliateOverview 是用户端推广页需要的全部数据，一次请求取齐。
type AffiliateOverview struct {
	Funnel  AffiliateFunnel    `json:"funnel"`
	Invitees []*AffiliateInvitee `json:"invitees"`
	// InviteesTruncated 表示名单被截断，前端据此提示还有更多。
	InviteesTruncated bool `json:"invitees_truncated"`
}

// GetAffiliateOverview 汇总某位邀请人的邀请名单与转化漏斗。
func GetAffiliateOverview(inviterId int) (*AffiliateOverview, error) {
	overview := &AffiliateOverview{Invitees: []*AffiliateInvitee{}}
	if inviterId <= 0 {
		return overview, nil
	}

	// 漏斗统计。User 带软删除，gorm 会自动附加 deleted_at IS NULL。
	if err := DB.Model(&User{}).
		Select("COUNT(*) AS registered, "+
			"COALESCE(SUM(CASE WHEN request_count > 0 THEN 1 ELSE 0 END), 0) AS active, "+
			"COALESCE(SUM(CASE WHEN topup_count > 0 THEN 1 ELSE 0 END), 0) AS topped_up").
		Where("inviter_id = ?", inviterId).
		Scan(&overview.Funnel).Error; err != nil {
		return nil, err
	}

	// 名单 + 每个被邀请人贡献的返利。用子查询一次取回，避免 N+1。
	const rebateSubQuery = "SELECT invitee_id AS invitee_id, SUM(rebate_quota) AS rebate_quota " +
		"FROM affiliate_rebates WHERE inviter_id = ? GROUP BY invitee_id"

	invitees := []*AffiliateInvitee{}
	if err := DB.Raw(
		"SELECT u.id AS user_id, u.username AS username, u.created_at AS created_at, "+
			"u.topup_count AS topup_count, u.used_quota AS used_quota, u.request_count AS request_count, "+
			"COALESCE(r.rebate_quota, 0) AS rebate_quota "+
			"FROM users u LEFT JOIN ("+rebateSubQuery+") r ON r.invitee_id = u.id "+
			"WHERE u.inviter_id = ? AND u.deleted_at IS NULL "+
			"ORDER BY u.id DESC LIMIT ?",
		inviterId, inviterId, affiliateInviteeListLimit+1,
	).Scan(&invitees).Error; err != nil {
		return nil, err
	}

	if len(invitees) > affiliateInviteeListLimit {
		invitees = invitees[:affiliateInviteeListLimit]
		overview.InviteesTruncated = true
	}
	overview.Invitees = invitees
	return overview, nil
}
