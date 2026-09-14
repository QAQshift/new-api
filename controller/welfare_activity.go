package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
)

// welfareActivityRequest 管理端创建/更新活动的请求体。
// 之所以与 model 分开：存储层把奖池保存为 JSON 字符串，而接口对调用方
// 始终以数组形式暴露，避免前端自己拼 JSON。
type welfareActivityRequest struct {
	Title           string                           `json:"title"`
	Description     string                           `json:"description"`
	StartsAt        int64                            `json:"starts_at"`
	EndsAt          int64                            `json:"ends_at"`
	MinConsumeQuota int                              `json:"min_consume_quota"`
	TotalLimit      int                              `json:"total_limit"`
	DailyLimit      int                              `json:"daily_limit"`
	Prizes          []operation_setting.LotteryPrize `json:"prizes"`
	Enabled         bool                             `json:"enabled"`
}

func (r *welfareActivityRequest) toModel(id int) (*model.WelfareActivity, error) {
	prizes, err := model.MarshalPrizes(r.Prizes)
	if err != nil {
		return nil, err
	}
	return &model.WelfareActivity{
		Id:              id,
		Title:           r.Title,
		Description:     r.Description,
		StartsAt:        r.StartsAt,
		EndsAt:          r.EndsAt,
		MinConsumeQuota: r.MinConsumeQuota,
		TotalLimit:      r.TotalLimit,
		DailyLimit:      r.DailyLimit,
		Prizes:          prizes,
		Enabled:         r.Enabled,
	}, nil
}

func welfareActivityIdParam(c *gin.Context) (int, bool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "无效的活动 ID"})
		return 0, false
	}
	return id, true
}

// GetWelfareActivities 返回当前用户可见的限时活动及其参与状态
func GetWelfareActivities(c *gin.Context) {
	userId := c.GetInt("id")
	activities, err := model.ListWelfareActivitiesForUser(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    gin.H{"activities": activities},
	})
}

// EnterWelfareActivity 参与一次限时活动
func EnterWelfareActivity(c *gin.Context) {
	activityId, ok := welfareActivityIdParam(c)
	if !ok {
		return
	}
	userId := c.GetInt("id")
	entry, err := model.UserEnterWelfareActivity(userId, activityId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "参与成功",
		"data": gin.H{
			"activity_id": entry.ActivityId,
			"entry_index": entry.EntryIndex,
			"prize_quota": entry.PrizeQuota,
			"created_at":  entry.CreatedAt,
		},
	})
}

// AdminListWelfareActivities 返回全部活动（含未开启）及发放统计
func AdminListWelfareActivities(c *gin.Context) {
	activities, err := model.ListWelfareActivitiesForAdmin()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    gin.H{"activities": activities},
	})
}

// AdminCreateWelfareActivity 新建限时活动
func AdminCreateWelfareActivity(c *gin.Context) {
	var request welfareActivityRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "请求参数格式错误"})
		return
	}
	activity, err := request.toModel(0)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "奖池格式无效"})
		return
	}
	if err := model.CreateWelfareActivity(activity); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "活动已创建",
		"data":    gin.H{"id": activity.Id},
	})
}

// AdminUpdateWelfareActivity 更新限时活动
func AdminUpdateWelfareActivity(c *gin.Context) {
	activityId, ok := welfareActivityIdParam(c)
	if !ok {
		return
	}
	var request welfareActivityRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "请求参数格式错误"})
		return
	}
	activity, err := request.toModel(activityId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "奖池格式无效"})
		return
	}
	if err := model.UpdateWelfareActivity(activity); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "活动已更新"})
}

// AdminDeleteWelfareActivity 删除限时活动
func AdminDeleteWelfareActivity(c *gin.Context) {
	activityId, ok := welfareActivityIdParam(c)
	if !ok {
		return
	}
	if err := model.DeleteWelfareActivity(activityId); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "活动已删除"})
}
