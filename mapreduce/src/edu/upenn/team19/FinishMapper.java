package edu.upenn.team19;
import java.io.IOException;

import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Mapper.Context;

public class FinishMapper extends Mapper<LongWritable, Text, Text, Text>{
	public void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException{
		String thisuser = value.toString().split("\t")[0];
		String[] otherusers = value.toString().split("\t")[1].split(" ")[1].split(";");
		
		// Can try to explore Hadoop's ranking property.
		for (String otheruser : otherusers) {
			String name = otheruser.split(",")[1];
			double rank = Double.parseDouble(otheruser.split(",")[0]);
			if (!name.equals(thisuser)) {
				context.write(new Text(thisuser), new Text(name + ":" + rank + ";"));
			}
		}
	}
}