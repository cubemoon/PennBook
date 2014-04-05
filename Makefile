export:
	rsync -vrz --delete web/* ec2.maimoe.net:~/pennbook
