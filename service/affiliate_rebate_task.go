package service

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"

	"github.com/bytedance/gopkg/util/gopool"
)

const (
	affiliateReleaseTickInterval = 10 * time.Minute
	// affiliateReleaseMaxRounds 限制单次任务最多处理多少批，避免积压时任务过长。
	affiliateReleaseMaxRounds = 20
)

var (
	affiliateReleaseOnce    sync.Once
	affiliateReleaseRunning atomic.Bool
)

// StartAffiliateRebateReleaseTask 启动邀请返利的冷却释放任务。
//
// 返利先进入「待确认」池，冷却期满后才释放为可转移额度。这是用来覆盖支付渠道
// 拒付/争议窗口的：本系统没有退款处理，冷却期是唯一的兜底手段。
//
// 多实例安全：真正的去重由 model.ReleaseDueAffiliateRebates 内部的逐条 CAS
// （pending -> confirmed）负责，因此即使多个 master 同时执行也不会重复释放。
func StartAffiliateRebateReleaseTask() {
	affiliateReleaseOnce.Do(func() {
		if !common.IsMasterNode {
			return
		}
		gopool.Go(func() {
			logger.LogInfo(context.Background(), fmt.Sprintf("affiliate rebate release task started: tick=%s", affiliateReleaseTickInterval))
			ticker := time.NewTicker(affiliateReleaseTickInterval)
			defer ticker.Stop()

			runAffiliateRebateReleaseOnce()
			for range ticker.C {
				runAffiliateRebateReleaseOnce()
			}
		})
	})
}

func runAffiliateRebateReleaseOnce() {
	// 单进程内防重入，避免上一轮还没跑完就叠加下一轮。
	if !affiliateReleaseRunning.CompareAndSwap(false, true) {
		return
	}
	defer affiliateReleaseRunning.Store(false)

	ctx := context.Background()
	totalReleased := 0
	for round := 0; round < affiliateReleaseMaxRounds; round++ {
		released, err := model.ReleaseDueAffiliateRebates()
		if err != nil {
			logger.LogWarn(ctx, fmt.Sprintf("affiliate rebate release failed: %v", err))
			return
		}
		totalReleased += released
		// 本批没有成功释放任何一条就结束，避免在异常记录上原地打转。
		if released == 0 {
			break
		}
	}
	if totalReleased > 0 {
		logger.LogInfo(ctx, fmt.Sprintf("affiliate rebate released: count=%d", totalReleased))
	}
}
