import { exec } from 'child_process';

/**
 * 提取需CDN缓存清除的文件路径
 * @param {string} rcloneCmd - 带--dry的rclone命令
 * @param {string[]} ext - 目标文件扩展名数组
 */
function getPurgeFiles(rcloneCmd, ext) {
    if (!rcloneCmd.includes('--dry')) {
        console.error('错误：命令必须包含 --dry 选项');
        return;
    }

    if (!ext || ext.length === 0) {
        console.error('错误：请指定需要处理的文件扩展名');
        return;
    }

    console.log('正在提取需CDN缓存清除的文件...');
    
    exec(rcloneCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`执行出错: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`命令错误: ${stderr}`);
            return;
        }

        const files = extractFiles(stdout, ext);
        
        if (files.length > 0) {
            console.log(`\n找到 ${files.length} 个文件:`);
            files.forEach(file => console.log(file));
        } else {
            console.log('\n未找到匹配文件');
        }
    });
}

/**
 * 从文本中提取指定扩展名的文件路径
 * @param {string} text - 待解析文本
 * @param {string[]} extensions - 目标扩展名
 * @returns {string[]} 匹配的文件路径数组
 */
function extractFiles(text, extensions) {
    const extPattern = extensions.join('|');
    const regex = new RegExp(`\\S+\\.(${extPattern})`, 'g');
    const matches = text.match(regex) || [];
    return [...new Set(matches)]; // 去重
}

// 配置区域
const rcloneCommand = 'rclone copy --dry-run remote:source ./local';
const targetExtensions = ['html', 'js', 'css', 'png', 'jpg', 'jpeg'];

// 执行
getPurgeFiles(rcloneCommand, targetExtensions);
    