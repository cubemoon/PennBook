package edu.upenn.team19;
import java.io.IOException;

import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Mapper.Context;

public class Diff1Mapper extends Mapper<LongWritable, Text, Text, Text>{
	
	public void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException{
		String[] line = value.toString().split("\t");
		String name = line[0];
		String[] ranks = line[1].split("||")[1].split(";");
		
		for (String rank : ranks) {
			String rankname = rank.split(",")[1];
			String ranknumber = rank.split(",")[0];
			context.write(new Text(name), new Text(ranknumber + "||" + rankname));
		}
	}
}